/**
 * Created by admin on 2016/10/20.
 */
var mHost = window.location.host;
var basePath = 'http://'+(mHost == '' ? '127.0.0.1':mHost)+':3000';
var mAudioInfo;
var mMusicList;

function init(callback) {
    $.get(basePath+'/res/get_audio_prop',function (audioInfo,st) {
        if(st == 'success' && audioInfo.duration > 0){
            console.log('init->duration:',audioInfo.duration);
            $.get(basePath+'/res/get_music_list',function (musicList,st) {
                if(st == 'success'){
                    mAudioInfo = audioInfo;
                    mMusicList = musicList;
                    //
                    mAudioInfo.duration = parseInt(audioInfo.duration);
                    mAudioInfo.currentTime = parseInt(audioInfo.currentTime);
                    callback(true)
                }else{
                    callback(false)
                }
            });
        }else{
            callback(false)
        }
    });
}

//自动更新滑动条的函数
function updateMusicProgress() {
    if(mAudioInfo.paused){
        return;
    }
    setTimeout(function () {
        refreshUI();
        // updateMusicProgress()
    },1000);
    /*setTimeout(function () {
        var currentValue = $("#music_progress").roundSlider('getValue');
        var newValue = currentValue + mMusicStep;
        if(currentValue < newValue){
            $("#music_progress").roundSlider('setValue',newValue);
        }
        //
        if(mAudioInfo.duration > mAudioInfo.currentTime){
            mAudioInfo.currentTime++;
            $('#current_time').html(formatSeconds(mAudioInfo.currentTime));
        }
        updateMusicProgress()
    },1000);*/
}

function refreshUI() {
    init(function (ok) {
        if(ok){
            //设置音乐信息
            $('input[type="range"]').val(mAudioInfo.volume).change();//音量
            $('#voice').html(mAudioInfo.volume);
            $('#play_mode').html(mAudioInfo.play_mode == 'normal' ? '顺序播放':'随机播放');
            $('#play_or_pause').html(mAudioInfo.paused ? '播放':'暂停');
            $('#current_music_name').html(mAudioInfo.src);
        }else{
            //客户端方法，本地端注释
            // $('#error_tips').show();
        }
        console.log('执行refreshUI()',ok);
    })
}

$(function () {
    console.log('host',mHost);
    if(!isNullOrEmpty(mHost)){
        refreshUI()
    }
    //
});

//手动音量控制
$('#range_volume').rangeslider({
    polyfill:false
    ,onSlideEnd: function(position, value) {
        //设置音量
        $.get(basePath+'/setting/volume/'+value,function (data,st) {
            //$('#voice').html(value);
        })
    }
});
//手动音乐进程控制:
//文档：http://roundsliderui.com/document.html
$("#music_progress").roundSlider({
    radius: 70
    ,width: 8
    ,handleSize: "+16"
    ,handleShape: "dot"
    ,sliderType: "min-range"
    ,min : 0
    ,max : 360
    ,showTooltip : false
});
$("#music_progress").on("change", function (e) {
    // console.log(e.value);
    // console.log($("#music_progress").roundSlider('getValue'));
    //换算成秒数，
    var musicValue = parseInt((e.value * mAudioInfo.duration) / 360);
    //设置远程，成功之后继续
    $.get(basePath+'/ctrl/audio/currentTime/'+musicValue,function (data,st) {
        //mAudioInfo.currentTime = parseInt(musicValue);
        //$('#current_time').html(formatSeconds(mAudioInfo.currentTime));
    })
});
//交互：切换菜单
$('#go2list').click(function () {
    $('#music_list').fadeIn();
});
$('#back2main').click(function () {
    $('#music_list').fadeOut();
});
//下一首
$('#play_next').click(function () {
    $.get(basePath+'/ctrl/play/next',function (data,st) {

    })
});
//上一首
$('#play_back').click(function () {
    $.get(basePath+'/ctrl/play/back',function (data,st) {

    })
});
//播放/暂停
$('#play_or_pause').click(function () {
    var order;
    if($(this).html() == '暂停'){
        order = 'pause'
    }else{
        order = 'play'
    }
    $.get(basePath+'/ctrl/play/'+order,function (data,st) {

    })
});
//切换模式
$('#check_mode').click(function () {
    var play_mode;
    if($('#play_mode').html() == '随机播放'){
        play_mode = 'normal'
    }else {
        play_mode = 'random'
    }
    $.get(basePath+'/setting/play_mode/'+play_mode,function (data,st) {

    })
});


//和服务端通信，被动控制
var socket = io.connect('http://localhost:3000');
//事件
socket.on('event', function (data){
    console.log('event',data.name);
    //console.log(data);
    switch (data.name){
        case 'play'://播放事件，上一首，下一首，暂停/播放
        case 'check_index'://选取一首
        case 'setCurrentTime'://音乐进度改变
        case 'refresh_music_list'://刷新歌单
            refreshUI();
            break;
        case 'update_time':
            $('#total_time').html(formatSeconds(data.d.duration));
            $('#current_time').html(formatSeconds(data.d.currentTime));
            $("#music_progress").roundSlider('setValue',data.d.music_progress_value);
            break;
    }
});

socket.on('setting', function (data){
    console.log('setting');
    console.log(data);
    refreshUI();
    // switch (data.name){
    //     case 'play_mode':
    //         //播放模式设置
    //         $('#play_mode').html(data.d == 'normal' ? '顺序播放':'随机播放');
    //         break;
    //     case 'volume':
    //         //音量设置
    //         //重新获取音乐信息
    //         break;
    // }
});