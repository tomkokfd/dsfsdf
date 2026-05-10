function kill_ctrl_key_combo(e) {
    var forbiddenKeys = new Array('a', 'c', 'x', 's', 'u');
    var key;
    var isCtrl;
    if (window.event) {
        key = window.event.keyCode;
        if (window.event.ctrlKey) isCtrl = true;
        else isCtrl = false;
    } else {
        key = e.which;
        if (e.ctrlKey) isCtrl = true;
        else isCtrl = false;
    }
    
    if (isCtrl) {
        for (i = 0; i < forbiddenKeys.length; i++) { 
            if (forbiddenKeys[i].toLowerCase() == String.fromCharCode(key).toLowerCase()) {
                return false;
            }
        }
    }
    return true;
}

function disable_selection(target) {
    if (typeof target.style.MozUserSelect != "undefined") {
        target.style.MozUserSelect = "none";
    }
    target.style.cursor = "default";
}

function double_mouse(e) {
    if (e.which == 2 || e.which == 3) {
        return false;
    }
    return true;
}

function enable_protection() {
    disable_selection(document.body); 
    document.captureEvents(Event.MOUSEDOWN);
    document.onmousedown = double_mouse; 
    document.oncontextmenu = function() {
        return false;
    }; 
    document.onkeydown = kill_ctrl_key_combo;
}

window.onload = function() { 
    enable_protection();
};