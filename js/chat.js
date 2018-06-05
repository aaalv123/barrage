$(function () {
    // 用户登录后 需设置userinfo 相关信息  聊天室触发用户进入房间code
    var userinfo = (function () {
        var islogin = false;
        var uid = 'y' + new Date().getTime();
        function login(callback) {
            callback();
        }
        function logout(callback){
            callback();
        }
        return {
            islogin: islogin,
            uid: uid,
            login: login,
            logout: logout
        }
    })();
    var chatRoom = (function () {
        var url = {
            socketUrl: 'ws://192.168.1.51:9025'
        }
        var code = {
            C_LOGIN: 0,
            C_ENTER_ROOM: 50,
            C_PING: 51,
            C_ROOM_CHAT: 52,
            C_EXIT_ROOM: 57

            // KILL_CONNECTION_TYPE : -1;
            // S_LOGIN : 0;
            // S_ENTER_ROOM : 50;
            // S_ROOM_CHAT : 52;
            // S_EXIT_ROOM : 57;
            // S_ROOM_PUBLIC_MSG : 590;
            // S_KICK_OUT_ROOM : 1000;
            // S_SILENT_ON : 1100;
            // S_SILENT_OFF : 1200;
        }
        var ws, ws_keepalive;
        function init() {
            if (typeof (WebSocket) !== 'function') {
                $('#chatroom').html('<p>您的浏览器不支持WebSocket,请更新IE10以上或其他浏览器！</p>');
                return false;
            }
            $('#connect').on('click', function () {
                $(this).attr('disabled', 'disabled');
                $('#chatroom').append('<p>正在建立连接</p>');
                ws = new WebSocket(url.socketUrl);
                ws.binaryType = 'arraybuffer';
                ws.onopen = function (evt) {
                    wsOpen(evt);
                };
                ws.onclose = function (evt) {
                    wsClose(evt);
                };
                ws.onerror = function (evt) {
                    wsError(evt);
                };
                ws.onmessage = function (evt) {
                    wsMessage(evt);
                };
            });
            $('#sendMessage').on('click', function () {
                if (!userinfo.login) {
                    alert('请登录！');
                    return false;
                }
                var inputValue = $('#messageBox').val().trim();
                if (inputValue == '') {
                    alert('请输入聊天内容！');
                    return false;
                }
                sendData(code.C_ROOM_CHAT, inputValue);
            });
            $('#disconnect').on('click', function () {
                ws.close();
            });
        }
        function wsOpen(evt) {
            $('#chatroom').append('<p>连接已打开</p>');
            $('#disconnect').removeAttr('disabled');
            $('#sendMessage').removeAttr('disabled');

            sendData(code.C_LOGIN, userinfo.uid);
        }
        function wsClose(evt) {
            clearTimeout(ws_keepalive);// 清除心跳包
            $('#connect').removeAttr('disabled');
            $('#disconnect').attr('disabled', 'disabled');
            $('#sendMessage').attr('disabled', 'disabled');
            $('#chatroom').append('<p>连接已关闭</p>');
            gobottom();
        }
        function wsError(evt) {
            clearTimeout(ws_keepalive);// 清除心跳包
            $('#connect').removeAttr('disabled');
            $('#disconnect').attr('disabled', 'disabled');
            $('#sendMessage').attr('disabled', 'disabled');
            $('#chatroom').append('<p>连接错误</p>');
            gobottom();
        }
        function wsMessage(evt) {
            var reciveView = new DataView(evt.data);
            var type = reciveView.getUint32(2);
            console.log(type);
            switch (type) {
                // S_LOGIN : 0;
                case 0: enterRoom();break; //websocketlogin = true;
                // S_ENTER_ROOM : 50;
                case 50: chatOptUser(reciveView); break;
                // S_ROOM_CHAT : 52;
                case 52: chatRoom(reciveView); break;
                // S_EXIT_ROOM : 57;
                case 57: chatOptUser(reciveView); break;
                // S_ROOM_PUBLIC_MSG : 590;
                case 590: chatPublic(reciveView); break;
                // S_KICK_OUT_ROOM : 1000;
                case 1000: chatOptUser(reciveView); break;
                // S_SILENT_ON : 1100;
                case 1100: chatOptUser(reciveView); break;
                // S_SILENT_OFF : 1200;
                case 1200: chatOptUser(reciveView); break;
            }
        }
        // webcocket登录后 确认用户是否登录 如果用户登录 发送用户进入房间数据
        function enterRoom(){
            if(userinfo.islogin){
                sendData(code.C_ENTER_ROOM);
            }
        }
        // 正常的聊天信息
        function chatRoom(view) {
            var tempArr = [];
            for (var j = 0; j < view.getUint16(6); j++) {
                tempArr[j] = view.getUint8(j + 8);
            }
            var realMes = byteToString(tempArr);
            $('#chatroom').append('<p>用户名：' + realMes + '<p>');
            gobottom();
        }
        // 其他用户信息 如进入房间 禁言 等
        function chatOptUser(view) {
            var tempArr = [];
            for (var j = 0; j < view.getUint16(6); j++) {
                tempArr[j] = view.getUint8(j + 8);
            }
            var realMes = byteToString(tempArr);
            $('#chatroom').append('<p class="uop">用户名：' + realMes + '<p>');
            gobottom();
        }
        // 公共聊天信息
        function chatPublic(view) {
            var tempArr = [];
            for (var j = 0; j < view.getUint16(6); j++) {
                tempArr[j] = view.getUint8(j + 8);
            }
            var realMes = byteToString(tempArr);
            $('#chatroom').append('<p class="pub_msg">' + realMes + '<p>');
            gobottom();
        }
        function sendData(type, data) {
            clearTimeout(ws_keepalive);// 清除心跳包
            var buffer;//buffer 构成为 Uint16 Uint32 Uint16 data
            var STB;
            var hasData = typeof (data) === 'undefined' || data === '';
            if (hasData) {
                buffer = new ArrayBuffer(2 + 4);
            } else {
                STB = stringToByte(data);
                buffer = new ArrayBuffer(2 + 4 + 2 + STB.length);
            }
            var view = new DataView(buffer);
            view.setUint16(0, buffer.byteLength - 2);//缓冲区整体长度
            view.setUint32(2, type);//标识位 如进入房间 发言等等
            if (!hasData) {
                view.setUint16(6, STB.length); // 要发送的数据长度
                var u8 = new Uint8Array(buffer, 8, STB.length);//发送的数据
                u8.set(STB);
            }
            console.log(view);
            ws.send(view);
            // 心跳包
            ws_keepalive = setInterval(function () {
                sendData(code.C_PING)
            }, 30000);
        }
        function stringToByte(str) {
            var bytes = new Array();
            var len, c;
            len = str.length;
            for (var i = 0; i < len; i++) {
                c = str.charCodeAt(i);
                if (c >= 0x010000 && c <= 0x10FFFF) {
                    bytes.push(((c >> 18) & 0x07) | 0xF0);
                    bytes.push(((c >> 12) & 0x3F) | 0x80);
                    bytes.push(((c >> 6) & 0x3F) | 0x80);
                    bytes.push((c & 0x3F) | 0x80);
                } else if (c >= 0x000800 && c <= 0x00FFFF) {
                    bytes.push(((c >> 12) & 0x0F) | 0xE0);
                    bytes.push(((c >> 6) & 0x3F) | 0x80);
                    bytes.push((c & 0x3F) | 0x80);
                } else if (c >= 0x000080 && c <= 0x0007FF) {
                    bytes.push(((c >> 6) & 0x1F) | 0xC0);
                    bytes.push((c & 0x3F) | 0x80);
                } else {
                    bytes.push(c & 0xFF);
                }
            }
            return bytes;
        }
        function byteToString(arr) {
            if (typeof arr === 'string') {
                return arr;
            }
            var str = '',
                _arr = arr;
            for (var i = 0; i < _arr.length; i++) {
                var one = _arr[i].toString(2),
                    v = one.match(/^1+?(?=0)/);
                if (v && one.length == 8) {
                    var bytesLength = v[0].length;
                    var store = _arr[i].toString(2).slice(7 - bytesLength);
                    for (var st = 1; st < bytesLength; st++) {
                        store += _arr[st + i].toString(2).slice(2);
                    }
                    str += String.fromCharCode(parseInt(store, 2));
                    i += bytesLength - 1;
                } else {
                    str += String.fromCharCode(_arr[i]);
                }
            }
            return str;
        }
        function gobottom() {
            $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
        }
        function exitRoom(){
            sendData(code.C_EXIT_ROOM);
        }
        return {
            init: init,
            exitRoom:exitRoom
        }
    })();
    userinfo.login(chatRoom.init);
    // userinfo.logout(chatRoom.exitRoom); //用户退出登录 聊天室触发退出房间
    // var danmubox = (function(){
    //     function init(){
    //         $('#danmusend').on('click',function(){
    //             var inputValue = $('#danmuinput').val().trim();
    //             if (inputValue == '') {
    //                 alert('请输入聊天内容！');
    //                 return false;
    //             }
    //             $('#danmuinput').val('');
    //             sendDanmu(inputValue);
    //         });
    //         $('#barrageBox').on('transitionend','.barrage',function(){
    //             alert(1);
    //         });
    //     }
    //     function sendDanmu(value){
    //         $('#barrageBox').prepend('<div class="barrage">'+ value +'</div>');
    //         setTimeout(function(){
    //             $('#barrageBox .barrage').eq(0).css('left','-100px');
    //         },0);
    //     }
    //     return {
    //         init:init
    //     }
    // })();
    // danmubox.init();
});
