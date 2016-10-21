var Editor = function ( name, string ) {

	var delay;
	var onChangeCallback;

	var dom = document.createElement( 'div' );
	dom.style.position = 'absolute';
	dom.style.backgroundColor = '#222';

	var title = document.createElement( 'div' );
	title.style.color = '#888';
	title.style.margin = '8px 0px 8px 0px';
	title.style.textAlign = 'center';
	title.textContent = name;
	dom.appendChild( title );

	setTimeout( function () {

		// Adding CodeMirror on the next frame.
		// https://groups.google.com/forum/#!topic/codemirror/63s-qWeCbZc

		var codemirror = CodeMirror( dom, {
			value: string,
			lineNumbers: true,
			matchBrackets: true,
			indentWithTabs: true,
			tabSize: 4,
			indentUnit: 4,
			mode: "text/x-glsl"
		} );
		codemirror.setOption( 'theme', 'monokai' );
		codemirror.on( 'change', function () {

			if ( onChangeCallback ) {

				clearTimeout( delay );
				delay = setTimeout( function () {

					onChangeCallback( codemirror.getValue() );

				}, 500 );

			}

		} );

	}, 0 );

	return {
		dom: dom,
		onChange: function ( callback ) {

			onChangeCallback = callback;

		}
	};

};
