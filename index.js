#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var fs = require('fs'),
    readline = require('readline'),
    program = require('commander'),
    AV = require('avoscloud-sdk').AV;

var _data = [],
    _failure = [],
    _check_tpl = 'active_notice_sms',
    _uncheck_tpl = 'active_notice_sms2';
var leanCloudConf = require('./data/config.json');


var initAV = function(appid){
    var _lconf = leanCloudConf[appid];
    AV.initialize(_lconf.appid, _lconf.appkey);
};


var loadFileData = function(file){
    if (!program.category){
        console.log('请用 -c 1 参数设置短信类型');
        return;
    }
    stats = fs.lstatSync(file);
    if (stats.isFile()){
        var array = fs.readFileSync(file).toString().split("\n");
        for(i in array) {
            var _num = array[i].replace(/[^\d]+/g,''),
                _re = /^1[0-9]{10}$/g;
            if (_num ){
                _data.push(_num);
            }
        }
        if (_data.length > 0){
            multiSend(_data,program.category);
        }
    }else{
        console.log('文件不存在');
    }
};

var multiSend = function(list,type){
    if (typeof list === 'string'){
        list = list.split(',');
    }
    for (i in list){
        sendSms(list[i],type);
    }
};

var sendSms = function(phone,type){
    if (!type) type = 1;
    var _data = {
        mobilePhoneNumber: phone,
        template: type == 1 ? _check_tpl : _uncheck_tpl,
        name:'彭博商业周刊'
    }

    AV.Cloud.requestSmsCode({mobilePhoneNumber:phone,template:'ibloomberg_sms',name:'彭博商业周刊'}).then(function(){
        //发送成功
        console.log('手机号码:'+ phone + "发送成功!\n");
    }, function(err){
        //发送失败
        //console.log(err);
        console.log('手机号码:'+ phone + "发送失败!\n");
        fs.appendFile('./data/failure.txt',phone+'\n',function(err){
            //console.log('write file error:'+ err);
        });
    });
};

/**
 * 分析提供的参数
 * @param str
 * @returns {string}
 */
var paserData = function(str){
    if (!str){
        return '';
    }
    if (!program.category){
        console.log('请用 -c 1 参数设置短信类型');
        return;
    }
    multiSend(str.split(','),program.category);
}
//初始化AV
initAV(1);

program
    .version('0.0.1')
    .usage('[options] <arguments ...>')
    .option('-c, --category <category>','发送类型 1:通过  2:未通过')
    .option('-f, --file <file>', '要发送短信的文本文件',loadFileData)
    .option('-d, --data <data>', '字符串,例如：111,222 多个用`,`分割',paserData)
    .option('-t, --type', 'json,xml,txt')
    .option('-s, --seperator', '分隔符，默认 ,', '',',')
    .parse(process.argv);
