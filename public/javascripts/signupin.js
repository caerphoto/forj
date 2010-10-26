;
if (typeof FORJ === "undefined") var FORJ = {
    ui: {
        buttons: $("input:submit"),
    }
}

FORJ.init = function() {
    FORJ.ui.buttons.button();
}; // FORJ.init()

$(document).ready(FORJ.init);
