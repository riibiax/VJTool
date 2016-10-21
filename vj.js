var VJ = (function() {

    var vj = {};

    //GENERAL SETTINGS
    var WIDTH = window.innerWidth;
    var HEIGHT = window.innerHeight;
    //threejs stuff
    var renderer, canvas, camera;
    var mesh;
    //stats
    var stats;
    //audio
    var audio;

    // init
    vj.init = function() {
        canvas = document.getElementById( "c" );
        preload();

    }
    // preload
    var preload = function () {
        var spinner = document.getElementById('loading_spinner');
        spinner.style.opacity = 1.0;

        var outTween = new TWEEN.Tween( spinner.style )
            .to( { opacity: 0.1 }, 1500 )
            .easing( TWEEN.Easing.Quadratic.In )
            .onComplete(function () {
                spinner.style.display = "none";
            });
        outTween.start();
        
        this.start();
    }
    //start
    this.start = function () {
        setup();
        animate();
    }
    // setup
    var setup = function () {
        var container = document.getElementById( 'container' );

        camera = new THREE.OrthographicCamera( - 0.5, 0.5, 0.5, - 0.5, 0, 1 );
        camera.position.z = 1;

        scene = new THREE.Scene();

        var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

        var uniforms = {
            u_time: { type: "f", value: 1.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2() },
            u_mouse: { type: "v2", value: new THREE.Vector2() },
            u_waveData: { type: "t", value: null },
            u_levelData: { type: "t", value: null },
            u_volume: { type: "f", value: 1.0 },
            u_beat : { type: "f", value: 1.0 }
        };

        uniforms.u_resolution.value.x = WIDTH;
        uniforms.u_resolution.value.y = HEIGHT;

        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: document.getElementById( 'vertexShader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        } );

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
        //editor
        addEditor(mesh.material.fragmentShader);

        renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: false});
        renderer.setPixelRatio( window.devicePixelRatio ); //to change or comment for high res devices
        renderer.setSize( WIDTH, HEIGHT );

        stats = new Stats();
        container.appendChild( stats.dom );

        ControlsHandler.init();

        //Get an Audio Context
        audio = new AudioHandler();
        audio.getMicInput();
        
        onWindowResize();
        window.addEventListener( 'resize', onWindowResize, false );
        window.addEventListener('keydown', onKeyDown, false);

        document.onmousemove = function(e){
          mesh.material.uniforms.u_mouse.value.x = e.pageX/WIDTH;
          mesh.material.uniforms.u_mouse.value.y = e.pageY/HEIGHT;
        }
    }

    vj.toggleFullScreen = function() {
        if (ControlsHandler.vizParams.fullScreen) {
            canvas.style.left = '0%';
            canvas.style.width = '100%';
            container.style.display = 'none';
            onWindowResize();
        }
        else {
            canvas.style.left = '50%';
            canvas.style.width = '50%';
            container.style.display = '';
            onWindowResize();
        }
    }

    function onKeyDown(event) {
        if(ControlsHandler.vizParams.fullScreen){
             switch ( event.keyCode ) {
                case 113: /* F2 */
                    ControlsHandler.vizParams.fullScreen= !ControlsHandler.vizParams.fullScreen;
                    vj.toggleFullScreen();
                    break;
            }
        }
    }

    function onWindowResize( event ) {
        if(ControlsHandler.vizParams.fullScreen){
            WIDTH=window.innerWidth;   
        }
        else{
            WIDTH=window.innerWidth*0.5;
        }
        HEIGHT=window.innerHeight;
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
        mesh.material.uniforms.u_resolution.value.x = WIDTH;
        mesh.material.uniforms.u_resolution.value.y = HEIGHT;
        renderer.setSize( WIDTH, HEIGHT );
    }

    function addEditor (shaderText) {
        var editor = new Editor( 'Fragment Shader', shaderText );
        editor.dom.style.top = '0';
        editor.dom.style.left = '0';
        editor.dom.style.width = '50%';
        editor.dom.style.height = '100%';
        editor.onChange( function ( string ) {
            if(ControlsHandler.vizParams.autoUpdate){
                mesh.material.fragmentShader = string;
                mesh.material.needsUpdate = true;
            }
        } );
        container.appendChild( editor.dom );
    }

    function animate() {
        requestAnimationFrame( animate );
        render();
        stats.update();
    }

    function render() {
        renderer.render( scene, camera );
        TWEEN.update(); 
        mesh.material.uniforms.u_time.value         += 0.05;
        mesh.material.uniforms.u_volume.value       = audio.getVolume();
        mesh.material.uniforms.u_beat.value         = audio.getBeat();
        mesh.material.uniforms.u_waveData.value     = audio.getWaveData();
        mesh.material.uniforms.u_levelData.value    = audio.getLevelData();
        audio.update();
    }

    return vj;
})();