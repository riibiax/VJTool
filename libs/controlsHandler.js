var ControlsHandler = function() {

	
	var audioParams = {
		volSens:1,
		beatHoldTime:40,
		beatDecayRate:0.97,
		beatMin:0.2
	};

	var vizParams = {
		fullScreen: false,
		autoUpdate: true
	};

	function init(){

		//Init DAT GUI control panel
		var gui = new dat.GUI({ autoPlace: false, width: 200 });
		gui.domElement.style.position= 'absolute';
        gui.domElement.style.left = '50%';
        gui.domElement.style.zIndex = '100';
        gui.domElement.style.marginLeft  = -gui.width + 'px';
		container.appendChild( gui.domElement);

		var f1 = gui.addFolder('Settings');
		f1.add(audioParams, 'volSens', 0, 6, 1).name("Gain");
		f1.add(audioParams, 'beatHoldTime', 0, 100, 1).name("Beat Hold");
		f1.add(audioParams, 'beatDecayRate', 0.9, 1, 0.01).name("Beat Decay");
		f1.add(audioParams, 'beatMin', 0.01, .3, 0.01).name("Beat Min");

		var f2 = gui.addFolder('Viz');
		f2.add(vizParams, 'fullScreen').listen().name("Full Screen").onChange(VJ.toggleFullScreen);
		f2.add(vizParams, 'autoUpdate').name("Auto Update");
		f1.open();
		f2.open();

	}

	return {
		init:init,
		audioParams: audioParams,
		vizParams:vizParams
	};
}();