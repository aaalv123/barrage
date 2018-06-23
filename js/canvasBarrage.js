(function () {
    'use strict';
    var canvasEle, canvasContext, canvasWidth, frameId;
    // 用户配置项
    // var defaultoption = {
    //     opacity: 1,
    //     range: 'top'//top bottom full
    // }
    // 默认配置项
    var actualoption = {
        fontFamily: "Microsoft yahei",
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#fff',
        range: 'top',
        speed: 2,
        trackHeight: 30, //轨道高度
        globalAlpha: 1
    };
    // 需要绘制的数组
    var drawArray = [];
    // 暂停
    var isPause = true;
    // 是否关闭弹幕
    var isClose = false;
    // 要移除元素计数器
    var removeItemCounter = 0;
    // 移除元素界限值 即有超过多少条需要移除的数据时 执行移除方法
    var removeItemLimit = 10;
    // 轨道数组 {y:y,canuse:true}
    var trackArray = [];
    // 轨道宽度数组
    var trackArrayWidth = [];
    // 使用轨道
    var startTrack = 0, endTrack = 1;
    // 弹幕间距 不重叠 弹幕间距为10
    var spacing = 10;


    // function init(canvas, option, special) {
    function init(canvas) {
        if (!canvas) {
            return;
        }
        // var option = option || {}
        // // 参数合并
        // for (var key in defaultoption) {
        //     if (option[key]) {
        //         if(key === 'opacity'){
        //             actualoption.color = 'rgba(255,255,255,'+ option[key] +')';
        //         }else{
        //             actualoption[key] = option[key];
        //         }
        //     } else {
        //         actualoption[key] = defaultoption[key];
        //     }
        // }
        // 设置默认颜色
        canvasEle = canvas;
        canvasContext = canvas.getContext('2d');
        canvasWidth = canvasEle.width;
        canvasContext.globalAlpha = actualoption.globalAlpha;
        //  轨道设置
        setTrack();
        // 显示区域
        setArea(actualoption.range);
        // 设置画笔
        setPen();
        // var barrageOrbit = Math.floor(canvas.height * (actualoption.range[1] - actualoption.range[0]) / actualoption.trackHeight);
        // var yy = Math.floor(barrageOrbit * Math.random() + 1) * actualoption.trackHeight;
        // console.log(yy);
        // 设置默认数据
        // setData();
        // 开始绘制
        // render();
    }
    // 设置轨道
    function setTrack() {
        var CH = canvasEle.height, TH = actualoption.trackHeight;
        var trackNumber = Math.floor(CH / TH);
        if ((CH % TH) <= 10) {
            trackNumber--;
        }
        for (var i = 0; i < trackNumber; i++) {
            trackArray[trackArray.length] = (i + 1) * TH;
            trackArrayWidth[trackArrayWidth.length] = spacing;
        }
    }
    // 设置显示区域
    function setArea(area) {
        switch (area) {
            case 'top':
                startTrack = 0;
                endTrack = Math.floor(trackArray.length / 2);
                break;

            case 'bottom':
                startTrack = Math.ceil(trackArray.length / 2);
                endTrack = trackArray.length;
                break;

            default:
                startTrack = 0;
                endTrack = trackArray.length;
                break;
        }
    }
    // 设置默认画笔
    function setPen(obj) {
        var font = '';
        if (obj) {
            font = obj.fontStyle + ' ' + obj.fontWeight + ' ' + obj.fontSize + 'px ' + obj.fontFamily;
        } else {
            font = actualoption.fontStyle + ' ' + actualoption.fontWeight + ' ' + actualoption.fontSize + 'px ' + actualoption.fontFamily;
        }
        canvasContext.font = font;
    }
    // 设置透明度
    function setOpacity(opacity){        
        canvasContext.globalAlpha = parseFloat(opacity);
    }
    // 构造函数
    function Barrage(obj) {
        this.speed = obj.speed;
        this.x = obj.x;
        this.y = obj.y;
        this.value = obj.value;
        this.width = obj.width;
        this.track = obj.track;
        this.remove = false;
        this.color = obj.color; //是否参与计算
    }
    // 画布绘制
    function draw() {
        var canPause = 0, length = drawArray.length;
        drawArray.forEach(function (obj, index) {
            canvasContext.fillStyle = obj.color;
            if (!obj.remove) {
                obj.x -= obj.speed;
                canvasContext.fillText(obj.value, obj.x, obj.y);
                // 移除屏幕元素做标记
                if (obj.x < -1 * obj.width) {
                    obj.remove = true;
                    removeItemCounter++;
                }
            }
            // 若drawArray剩余数据不超过 removeItemLimit 需要记录下剩余数据是否已经移除视窗 如果都已经移动到视窗外面 停止canvas绘制
            if (length < removeItemLimit) {
                if (obj.remove) {
                    canPause++;
                }
            }
            if (length === canPause) {
                isPause = true;
            }
            // 记录使用的轨道剩余空间 即是否距离视窗右边超过 spacing  若已超过 不做记录 没有超过 记录到轨道宽度数组中
            if (canvasWidth - obj.x - obj.width <= spacing) {
                trackArrayWidth[obj.track] = canvasWidth - obj.x - obj.width;
            }
        });
        // 计数器大于removeItemLimit 移除不需要绘制的元素
        if (removeItemCounter >= removeItemLimit) {
            removeItem();
        }
    }
    // 计算使用轨道
    function calculateTrack() {
        var minwidth = spacing - trackArrayWidth[startTrack], index = startTrack;//minwidth : 记录 trackArrayWidth 的最小宽度 index：记录最小宽度的索引
        for (var i = startTrack; i < endTrack; i++) {
            if (spacing - trackArrayWidth[i] <= 0) {
                index = i;
                break;
            } else {
                if (minwidth > spacing - trackArrayWidth[i]) {
                    minwidth = spacing - trackArrayWidth[i];
                    index = i;
                }
            }
        }
        return index;
    }
    // 移除不需要绘制的元素
    function removeItem() {
        var tempArr = [];
        drawArray.forEach(function (obj, index) {
            if (!obj.remove) {
                tempArr[tempArr.length] = obj;
            }
        });
        drawArray = tempArr;
        removeItemCounter = 0;
    }
    // 定时重绘画布
    function render() {
        canvasContext.clearRect(0, 0, canvasWidth, canvasEle.height);
        draw();
        if (!isPause) {
            frameId = requestAnimationFrame(render);
        }
    }
    // 添加弹幕
    function addItem(item) {
        if(isClose){
            return false;
        }
        var track = calculateTrack();
        drawArray.push(new Barrage({
            speed: actualoption.speed,
            x: canvasWidth,
            y: trackArray[track],
            value: item.value,
            width: Math.ceil(canvasContext.measureText(item.value).width),
            track: track,
            color: item.color || actualoption.color
        }));
        if (isPause) {
            isPause = false;
            render();
        }
    }
    function addSpecialItem(item) {
        if(isClose){
            return false;
        }
        var track = calculateTrack();
        var ele = new Barrage({
            speed: item.speed,
            x: item.x,
            y: item.y,
            value: item.value,
            width: Math.ceil(canvasContext.measureText(item.value).width),
            track: track,
            color: item.color
        });
        drawArray.push(ele);
        setTimeout(function(){
            ele.x = -1 * ele.width;
            ele.remove = true;
        },item.duration);
        if (isPause) {
            isPause = false;
            render();
        }
    }
    // 启动弹幕
    function start() {
        if(isClose){
            return false;
        }
        isPause = false;
        render();
    }
    // 暂停弹幕
    function pause() {
        if(isClose){
            return false;
        }
        isPause = true;
    }
    // 关闭弹幕
    function close(){
        cancelAnimationFrame(frameId);
        drawArray = [];
        for (var i = 0; i < trackArrayWidth.length; i++) {
            trackArrayWidth[i] = spacing;
        }
        canvasContext.clearRect(0, 0, canvasWidth, canvasEle.height);
        isPause = true;
        isClose = true;
    }
    function open(){
        isClose = false;
    }
    var canvasBarrage = {
        init: init,
        add: addItem,
        addSpecialItem: addSpecialItem,
        start: start,
        pause: pause,
        setArea: setArea,
        setOpacity: setOpacity,
        close: close,
        open: open
    }
    var _globals = (function(){ return this || (1,eval)("this"); }());
    !('socket' in _globals) && (_globals.canvasBarrage = canvasBarrage); 
})();
canvasBarrage.init(document.getElementById('barrage'));
// 添加弹幕普通
document.getElementById('danmusend').addEventListener('click', function () {
    canvasBarrage.add({
        value: document.getElementById('danmuinput').value
    });
}, false);
// 添加弹幕带颜色
document.getElementById('danmusend1').addEventListener('click', function () {
    canvasBarrage.add({
        value: document.getElementById('danmuinput').value,
        color: '#ff0'
    });
}, false);
// 添加固定弹幕带颜色
document.getElementById('danmusend2').addEventListener('click', function () {
    canvasBarrage.addSpecialItem({
        value: document.getElementById('danmuinput').value,
        color: '#f00',
        speed : 0,
        x: 200 + Math.random()*100,
        y: (Math.random()+1)*100,
        duration: 3000
    });
}, false);
// 暂停
document.getElementById('pause').addEventListener('click', function () {
    canvasBarrage.pause();
}, false);
// 开始
document.getElementById('start').addEventListener('click', function () {
    canvasBarrage.start();
}, false);
// 顶部
document.getElementById('top').addEventListener('click', function () {
    canvasBarrage.setArea('top');
}, false);
// 底部
document.getElementById('bottom').addEventListener('click', function () {
    canvasBarrage.setArea('bottom');
}, false);
// 全屏
document.getElementById('full').addEventListener('click', function () {
    canvasBarrage.setArea('full');
}, false);
// 透明度
document.getElementById('opacity').addEventListener('change', function () {
    switch (this.value) {
        case '无':
            canvasBarrage.setOpacity(1);
            break;
        case '低':
            canvasBarrage.setOpacity(0.8);
            break;
        case '中':
            canvasBarrage.setOpacity(0.5);
            break;
        case '高':
            canvasBarrage.setOpacity(0.2);
            break;
    }
}, false);
// 关闭弹幕
document.getElementById('close').addEventListener('click', function () {
    canvasBarrage.close();
}, false);
// 打开弹幕
document.getElementById('open').addEventListener('click', function () {
    canvasBarrage.open();
}, false);


// 播放器控制
var videoplayer = document.getElementById('videoplayer');
var playerTimeId;
var duration;
var videoprocessWidth = document.getElementById('videoprocess').clientWidth;
// 播放
document.getElementById('controlplay').addEventListener('click', function () {
    if(videoplayer.paused){
        this.innerHTML = '暂停';
        videoplayer.play();
        // playtime();
    }else{
        this.innerHTML = '播放';
        videoplayer.pause();
        // cancelAnimationFrame(playerTimeId);
    }
}, false)
// 获取视频总长度
videoplayer.addEventListener('loadedmetadata', function () {
    duration = videoplayer.duration;
    document.getElementById('videotime').innerHTML = '<em id="playerNowTime">0:00</em> / ' + timeformate(duration);
}, false)
// 更新视频时间
videoplayer.addEventListener('timeupdate', function () {
    var curtime = videoplayer.currentTime;
    document.getElementById('playerNowTime').innerHTML = timeformate(curtime);
    document.getElementById('videothumb').style.width = 100 * curtime / duration + '%';
    danmu(curtime);
}, false)
// seeking
document.getElementById('videoprocess').addEventListener('click', function (e) {
    var curtime = videoplayer.currentTime = duration * e.offsetX / videoprocessWidth;
    document.getElementById('videothumb').style.width = 100 * curtime / duration + '%';
    testdata.forEach(function(ele,index){
        if(ele.time > curtime){
            ele.isShow = false;
        }else{
            ele.isShow = true;
        }
    });
}, false);

function danmu(curtime){
    for(var i = 0;i < testdata.length;i++){
        if(testdata[i].isShow){
            continue;
        }
        if(testdata[i].time <= curtime && !testdata[i].isShow){
            canvasBarrage.add({
                value: testdata[i].text
            });
            testdata[i].isShow = true;
        }
    }
}

function timeformate(time){
    var sec = parseInt(time/60);
    var min = parseInt(time%60);
    var hours = 0;
    min = min < 10 ? '0' + min : min;
    if(sec > 60){
        hours = parseInt(sec/60);
        sec = parseInt(sec%60);
        sec = sec < 10 ? '0' + sec : sec;
        return hours +':'+ sec +':'+ min;  
    }
    return sec +':'+ min;
}

var testdata = [
    {
        text:'测试内容1',
        isShow:false,
        time:10
    },
    {
        text:'测试内容2',
        isShow:false,
        time:30
    },
    {
        text:'测试内容3',
        isShow:false,
        time:50
    },
    {
        text:'测试内容4',
        isShow:false,
        time:84
    },
    {
        text:'测试内容5',
        isShow:false,
        time:92
    },
    {
        text:'测试内容6',
        isShow:false,
        time:120
    },
    {
        text:'测试内容7',
        isShow:false,
        time:121
    },
    {
        text:'测试内容8',
        isShow:false,
        time:122
    },
    {
        text:'测试内容9',
        isShow:false,
        time:133
    },
    {
        text:'测试内容10',
        isShow:false,
        time:148
    },
    {
        text:'测试内容11',
        isShow:false,
        time:169
    },
    {
        text:'测试内容12',
        isShow:false,
        time:203
    },
    {
        text:'测试内容13',
        isShow:false,
        time:214
    },
    {
        text:'测试内容14',
        isShow:false,
        time:233
    },
    {
        text:'测试内容15',
        isShow:false,
        time:235
    }
];
