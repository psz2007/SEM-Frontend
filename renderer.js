var id = 0;
function newMessage(t, col = "red") {
    let msg = document.createElement("div"), cur = ++id;
    msg.setAttribute("id", `msg-${cur}`);
    msg.setAttribute("class", `code ui ${col} inverted nag`);
    msg.setAttribute("onclick", `$('#msg-${cur}').nag('hide');`);
    msg.innerHTML = `<span style='color: #FFF; white-space: pre-wrap;'>${t}</span>`;
    document.getElementById("messages").appendChild(msg);
    $(`#msg-${cur}`).nag("show");
    setTimeout(() => {
        $(`#msg-${cur}`).nag("hide");
        setTimeout(() => {
            $(`#msg-${cur}`).nag("destroy");
            document.getElementById("messages").removeChild(msg);
        }, 5000);
    }, 7500);
}
const customConsoleLog = (t) => {
    console.log(t);
    newMessage(typeof t === "object" ? JSON.stringify(t) : String(t), "green");
};
const customConsoleDebug = (t) => {
    console.log(t);
    newMessage(typeof t === "object" ? JSON.stringify(t) : String(t), "yellow");
};
const customConsoleError = (t) => {
    console.error(t);
    newMessage(typeof t === "object" ? JSON.stringify(t) : String(t), "red");
};

async function searchPort() {
    const ports = await window.sem_control.getports();
    const portSelect0 = document.getElementById('comPortSelect0'), portSelect1 = document.getElementById('comPortSelect1');
    portSelect0.innerHTML = '<option value="" disabled selected>Select port</option>';
    portSelect1.innerHTML = '<option value="" disabled selected>Select port</option>';
    ports.forEach(port => {
        customConsoleLog(port);
        const option0 = document.createElement('option'), option1 = document.createElement('option');
        option0.value = port.path;
        option0.textContent = port.path;
        option1.value = port.path;
        option1.textContent = port.path;
        portSelect0.appendChild(option0);
        portSelect1.appendChild(option1);
    });
}

var h = 20, v = 20;
async function connectPort(op) {
    const portPath = $(`#comPortSelect${op}`).dropdown("get value");
    const baudRate = parseInt($(`#baudRateSelect${op}`).dropdown("get value"));
    const dataBits = parseInt($(`#dataBitsSelect${op}`).dropdown("get value"));
    const stopBits = parseInt($(`#stopBitsSelect${op}`).dropdown("get value"));
    const parity = $(`#parityBitSelect${op}`).dropdown("get value");
    if (portPath === '-') {
        alert('Please select a COM port.');
        return;
    }
    try {
        if (op == 1) {
            [h, v] = document.getElementById(`resolution${op}`).value.split('x').map(x => parseInt(x)) || [400, 400];
        } else {
            let th, tv;
            [th, tv] = document.getElementById(`resolution${op}`).value.split('x').map(x => parseInt(x)) || [400, 400];
            Cmds[0] = `scrd_pic_lp_nc 4095 4095 4095 4095 ${th} ${tv} 0`;
            for(let i in Cmds) {
                const v = Cmds[i];
                let t = document.createElement("option");
                t.value = t.innerHTML = v;
                t.class = "code";
                document.getElementById("cmdArea").appendChild(t); 
            }
            $(".ui.search.dropdown").dropdown();
        }
        const res = await window.sem_control.openport(portPath, baudRate, dataBits, stopBits, parity, op);
        if (!res) {
            throw new Error("Port not available");
        }
        customConsoleLog('Port opened successfully', res);
    } catch (err) {
        customConsoleError('Error opening port:', err);
        alert(err);
    }
    saveSettings(op);
}
async function closePort(op) {
    try {
        const res = await window.sem_control.closeport(op);
        customConsoleLog('Port closed successfully: ' + JSON.stringify(res));
    } catch (err) {
        customConsoleError('Error closing port:', err);
    }
}

function datetoString(t) {
	Date.prototype.format = function (fmt) {
		let o = {
			"M+": this.getMonth() + 1,
			"d+": this.getDate(),
			"h+": this.getHours(),
			"m+": this.getMinutes(),
			"s+": this.getSeconds(),
			"q+": Math.floor((this.getMonth() + 3) / 3),
			"S": this.getMilliseconds()
		};
		if (/(y+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		}
		for (let k in o) {
			if (new RegExp("(" + k + ")").test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
			}
		}
		return fmt;
	}
	let cur = new Date(t).format("yyyy_MM_dd_hh_mm_ss");
	return cur.toString();
}

function saveSettings(id) {
    const settings = {
        baudRate: $(`#baudRateSelect${id}`).dropdown("get value") || 9600,
        dataBits: $(`#dataBitsSelect${id}`).dropdown("get value") || 8,
        stopBits: $(`#stopBitsSelect${id}`).dropdown("get value") || 1,
        parity: $(`#parityBitSelect${id}`).dropdown("get value") || 'none',
    };
    localStorage.setItem(`serialSettings_${id}`, JSON.stringify(settings));
}

function loadSettings(id) {
    try {
        const settings = JSON.parse(localStorage.getItem(`serialSettings_${id}`));
        if (settings) {
            document.getElementById(`baudRateSelect${id}`).value = settings.baudRate || 9600;
            document.getElementById(`dataBitsSelect${id}`).value = settings.dataBits || 8;
            document.getElementById(`stopBitsSelect${id}`).value = settings.stopBits || 1;
            document.getElementById(`parityBitSelect${id}`).value = settings.parity || 'none';
        }
    } catch (err) {
        customConsoleError('Error loading settings:', err);
    }
}

function scrollToBottom (t) {
    var ta = document.getElementById(t);
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    ta.blur(), ta.focus(), ta.blur();
}
async function refreshOutput() {
    const data = await window.sem_control.readport(0, true);
    document.getElementById('sendArea').value += data.split('\n').filter(line => !!line).map(line => "<<< " + line).join('\n') + "\n";
    scrollToBottom('sendArea');
}
function clearCommand() {
    document.getElementById('sendArea').value = '';
    scrollToBottom('sendArea');
}
const Cmds = [
    "scrd_pic_lp_nc 4095 4095 4095 4095 400 400 0",
    "backtrace", "list", "version", "clear", "free", "ps", "help",
    "pin", "adc", "dac", "reboot", "adc_read_single",
    "dac_x1", "dac_x2", "dac_y1", "dac_y2",
    "set_x1_value", "set_x2_value", "set_y1_value", "set_y2_value",
    "scrd_pic_lp_c", "scrd_pic_lp_nc", "scan_pic_lp_c", "scan_pic_lp_nc",
    "set_scan_time",
];
function appendCommand() {
    document.getElementById('sendArea').value += document.getElementById('cmdArea').value + "\n";
    document.getElementById('cmdArea').value = "";
    scrollToBottom('sendArea');
}
const isCmd = (line) => line.indexOf('>>>') < 0 && line.indexOf('<<<') < 0;
async function sendCommand(data) {
    let cmd = (data || document.getElementById('sendArea').value).trim();

    const command = cmd.split('\n').map(line => isCmd(line) ? line.trim() : "").filter(line => !!line);
    const run = async (cmd) => await window.sem_control.writeport(cmd, 0).then(response => {
        customConsoleLog('Command sent successfully:', response);
    }).catch(error => {
        customConsoleError('Error sending command:', error);
    });
    const exec = (i) => {
        if (i < command.length) customConsoleDebug(command[i]);
        return i < command.length ? new Promise(resolve => exec(i+1)).then(run(command[i])) : Promise.resolve();
    };
    exec(0);
    cmd = cmd.split('\n').map(line => (isCmd(line) ? ">>> " : "") + line.trim()).join('\n') + '\n';
    if (!data) document.getElementById('sendArea').value = cmd;
    scrollToBottom('sendArea');
}

var sprFlag = false;
async function toggleSuperpose() {
    if (sprFlag) {
        sprFlag = false;
        document.getElementById("sprToggler").classList.add("blue");
        document.getElementById("sprToggler").classList.remove("green");
        document.getElementById("sprToggler").innerHTML = "Superpose Off";
    } else {
        sprFlag = true;
        document.getElementById("sprToggler").classList.add("green");
        document.getElementById("sprToggler").classList.remove("blue");
        document.getElementById("sprToggler").innerHTML = "Superpose On";
    }
}
async function clearData() {
    document.getElementById('dataArea').value = '';
    $("#prg-1").progress({percent: 0});
    scrollToBottom('dataArea');
    await window.sem_control.readport(1, true);
}
async function refreshData() {
    const data = await window.sem_control.readport(1, false);
    const Lval = $("#sld-1").slider("get thumbValue", 'first'), Rval = $("#sld-1").slider("get thumbValue", 'second');
    console.log(Lval, Rval);
    document.getElementById('dataArea').value = [...data].map(a => a.charCodeAt(0).toString(16)).join('');
    $("#prg-1").progress({percent: data.length / (h * v) * 100});
    scrollToBottom('dataArea');
    if (sprFlag) {
        document.getElementById('semImage').src = await window.sem_control.getSuperposedImageData(h || 400, v || 400, Lval, Rval);
    } else {
        document.getElementById('semImage').src = await window.sem_control.getImageData(h || 400, v || 400, Lval, Rval);
    }
}
var autoFlag = false, autoIntv = -1;
async function toggleAutoRefresh() {
    if (autoFlag) {
        autoFlag = false;
        clearInterval(autoIntv);
        document.getElementById("autoToggler").classList.remove("primary");
        document.getElementById("autoToggler").innerHTML = "Auto Update Off";
    } else {
        autoFlag = true;
        autoIntv = setInterval(() => {
            refreshData();
        }, 250);
        document.getElementById("autoToggler").classList.add("primary");
        document.getElementById("autoToggler").innerHTML = "Auto Update On";
    }
}

async function downloadImage() {
    const timeStamp = datetoString(Date.now());
    const Lval = $("#sld-1").slider("get thumbValue", 'first'), Rval = $("#sld-1").slider("get thumbValue", 'second');
    try {
        if (sprFlag) {
            await window.sem_control.saveSuperposedImage(h || 400, v || 400, `pic_${timeStamp}.png`, Lval, Rval);
        } else {
            await window.sem_control.saveImage(h || 400, v || 400, `pic_${timeStamp}.png`, Lval, Rval);
        }
        customConsoleLog(`Picture pic_${timeStamp}.png saved.`);
    } catch {
        customConsoleError(`[${timeStamp}] Failed to download image.`);
    }
}
function saveasImage() {
    // bruh
}

// for old version compatibility

// function applyOffset() {
//     const cmd = document.getElementById('sendArea');
//     let data = "";
//     for (let ch = 0; ch < 5; ch++) {
//         const offset = parseInt($(`#slider-${ch}-1`).slider("get value"));
//         data += `dac_scan_offset(${ch}, ${offset});\n`;
//     }
//     sendCommand(data = data.trim());
//     data = ('\n' + data).split('\n').join('\n>>> ').trim() + '\n';
//     cmd.innerHTML += data;
// }
// function resetOffset() {
//     const cmd = document.getElementById('sendArea');
//     let data = "dac_reset();\n";
//     sendCommand(data);
//     cmd.innerHTML += data;
// }
// function applyCurrent() {
//     const cmd = document.getElementById('sendArea');
//     let data = "";
//     for (let ch = 0; ch < 5; ch++) {
//         const offset = parseInt($(`#slider-${ch}-2`).slider("get value")),
//             mul = ch ? parseFloat($(`#mul-${2 - ch % 2}`)[0].value): 1;
//         data += `dac_current(${ch}, ${offset * mul});\n`;
//     }
//     sendCommand(data = data.trim());
//     data = ('\n' + data).split('\n').join('\n>>> ').trim() + '\n';
//     cmd.innerHTML += data;
// }

// function scanPicture() {
//     const cmd = document.getElementById('sendArea');
//     let data = `scan_line(${h});\n`;
//     sendCommand(data = data.trim());
//     data = ('\n' + data).split('\n').join('\n>>> ').trim() + '\n';
//     cmd.innerHTML += data;
//     const id = setInterval(() => {
//         refreshOutput();
//         const percent = window.sem_control.readport(1, false) / (h * v) * 100;
//         $("#prg-1").progress({
//             percent: percent
//         });
//         if (percent == 100) {
//             customConsoleLog("Scan complete");
//             clearInterval(id);
//         }
//     }, 100);
// }
// const B = 1 << 24;
// const ord = (x) => x.charCodeAt(0);
// const chr = (x) => String.fromCharCode(Math.round(Math.max(Math.min(x, 255), 0)));
// function filterOutput() {
//     const data = document.getElementById('logArea').value;
//     const a = parseFloat(document.getElementById('val-a').value);
//     const b = parseFloat(document.getElementById('val-b').value);
//     // const c = parseFloat(document.getElementById('val-c').value);
//     data = [...data].map(x => chr(Math.log(ord(x) / B) / Math.log(a) + b)).join('');
//     document.getElementById('logArea').value = data;
//     alert('Picture not implemented yet.');
// }
// function filterLinear() {
//     const data = document.getElementById('logArea').value;
//     const a = parseFloat(document.getElementById('val-a').value);
//     const b = parseFloat(document.getElementById('val-b').value);
//     // const c = parseFloat(document.getElementById('val-c').value);
//     data = [...data].map(x => chr((a * ord(x) + b) / B)).join('');
//     document.getElementById('logArea').value = data;
//     alert('Picture not implemented yet.');
// }
// function filterExp() {
//     const data = document.getElementById('logArea').value;
//     const a = parseFloat(document.getElementById('val-a').value);
//     const b = parseFloat(document.getElementById('val-b').value);
//     const c = parseFloat(document.getElementById('val-c').value);
//     data = [...data].map(x => chr(a * Math.exp(b * ord(x) / B) + c)).join('');
//     document.getElementById('logArea').value = data;
//     alert('Picture not implemented yet.');
// }
// function filterAuto() {
//     const data = document.getElementById("logArea").value;
//     const a = parseFloat(document.getElementById("val-a").value);
//     const b = parseFloat(document.getElementById("val-b").value);
//     const c = parseFloat(document.getElementById("val-c").value);
//     const low = Math.min([...data].map(x => x.charCodeAt(0)));
//     const high = Math.max([...data].map(x => x.charCodeAt(0)));
//     customConsoleLog(`low: ${low}, high: ${high}`);
//     data = [...data].map(x => chr((ord(x) - low) / (high - low) * 255)).join('');
//     alert('Not implemented yet.');
// }

// function setSliders() {
//     const s = (from = false, to = false) => {
//         const config = {
//             min: -500, max: 500, step: 1, value: 0,
//             showThumbTooltip: true,
//             tooltipConfig: {
//                 position: 'bottom center',
//                 variation: 'small visible green'
//             }
//         };
//         if (from) {
//             config.onMove = () => {
//                 const val = $(`#${from}`).slider("get value");
//                 $(`#${to}`).slider("set value", val, fireChange = false);
//             };
//         }
//         return config;
//     };
//     $("#slider-0-1").slider(s());
//     $("#slider-0-2").slider(s());
//     $("#slider-1-1").slider(s());
//     $("#slider-1-2").slider(s("slider-1-2", "slider-3-2"));
//     $("#slider-2-1").slider(s());
//     $("#slider-2-2").slider(s("slider-2-2", "slider-4-2"));
//     $("#slider-3-1").slider(s());
//     $("#slider-3-2").slider(s("slider-3-2", "slider-1-2"));
//     $("#slider-4-1").slider(s());
//     $("#slider-4-2").slider(s("slider-4-2", "slider-2-2"));

//     $("#slider-0-1").addClass("disabled");
//     $("#slider-0-2").addClass("disabled");
//     $("#slider-1-1").addClass("disabled");
//     $("#slider-1-2").addClass("disabled");
//     $("#slider-2-1").addClass("disabled");
//     $("#slider-2-2").addClass("disabled");
//     $("#slider-3-1").addClass("disabled");
//     $("#slider-3-2").addClass("disabled");
//     $("#slider-4-1").addClass("disabled");
//     $("#slider-4-2").addClass("disabled");
// }

function switchtoTerminal() {
    document.getElementById("terminal").style.display = "block";
    document.getElementById("picture").style.display = "none";
}
function switchtoPicture() {
    document.getElementById("terminal").style.display = "none";
    document.getElementById("picture").style.display = "block";
}

window.onload = () => {
    loadSettings(0);
    loadSettings(1);
    switchtoTerminal();
    // setSliders();
    $("#prg-1").progress({});
    $("#sld-1").slider({
        min: 0, max: 255,
        start: 0, end: 255, step: 1,
        showThumbTooltip: true,
        tooltipConfig: {
            position: 'top center',
            variation: 'small visible green'
        }
    });
    searchPort();
};
