var canvas_width = 1000;
var requstFrame;
function main(){
	var canvas = document.getElementById('mycanvas');
	var gl = canvas.getContext('webgl2');


	//experiment variables
	var dimension = 400;
	//extensions
	load_extensions(gl)

    var init_state = initialState2D(dimension);
    var next_state = initialState2D(dimension);
	var current_tex = newTexture(gl,init_state,dimension);
	var next_tex = newTexture(gl,next_state,dimension);

	//make framebufers depending on depth
	var fbs_current = [];
	var fbs_next = [];
	var depth = dimension;
	for(var i = 0;i<depth;i++){
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
		gl.framebufferTextureLayer(
	        gl.FRAMEBUFFER,
	        gl.COLOR_ATTACHMENT0,
	        current_tex,
	        0, // mip level
	        i, // layer
	    );
	    fbs_current.push(fb);
	}
	for(var i = 0;i<depth;i++){
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
		gl.framebufferTextureLayer(
	        gl.FRAMEBUFFER,
	        gl.COLOR_ATTACHMENT0,
	        next_tex,
	        0, // mip level
	        i, // layer
	    );
	    fbs_next.push(fb);
	}

	var vsSource = document.getElementById("vs_step").text.trim();
    var fsSource = document.getElementById("fs_step").text.trim();
    var vertexShader = compShader(gl,vsSource,gl.VERTEX_SHADER)
    var fragmentShader = compShader(gl,fsSource,gl.FRAGMENT_SHADER)
    var program = makeProgram(gl,vertexShader,fragmentShader);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
   	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,-1, 1,-1, -1,1, 1,1 ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    var depth_loc = gl.getUniformLocation(program, "dept");
    var iteration_loc = gl.getUniformLocation(program, "iter");
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,dimension,dimension);
    var total_steps = 15000;
    var steps = Math.floor(total_steps/depth);
    for(var i = 0;i<depth;i++){
    	gl.uniform1f(depth_loc,i);
    	for(var j = 0;j<steps;j++){
    		gl.uniform1f(iteration_loc,j);
    		gl.bindTexture(gl.TEXTURE_3D,[current_tex, next_tex][j % 2]);
    		var picked_fb = [fbs_next,fbs_current][j%2];
    		gl.bindFramebuffer(gl.FRAMEBUFFER, picked_fb[i]);
			gl.drawBuffers([
			     gl.COLOR_ATTACHMENT0
		  	]);
    		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    	}
    	
    	
    }
    //ta del maybe v draw funkcije
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //anime = true, small resolution, max = 563, smooth animation = 200
    var checkbox = document.getElementById("highRes");
    checkbox.addEventListener('change',function(){
    	if(this.checked){
    		cancelAnimationFrame(requstFrame);
    		drawVolumeCubes(gl,current_tex,500,canvas,false);
    	}else{
    		drawVolumeCubes(gl,current_tex,200,canvas,true)
    	}
    })
    drawVolumeCubes(gl,current_tex,200,canvas,false)
    //drawVolumeSlices(gl,current_tex,canvas)
}	

main()

//general functions
function drawVolumeSlices(gl,current_tex,canvas){
	var vsSource = document.getElementById("vs").text.trim();
    var fsSource = document.getElementById("fs").text.trim();
    var vertexShader = compShader(gl,vsSource,gl.VERTEX_SHADER)
    var fragmentShader = compShader(gl,fsSource,gl.FRAGMENT_SHADER)
	
    var program = makeProgram(gl,vertexShader,fragmentShader);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
   	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,-1, 1,-1, -1,1, 1,1 ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    //uniforms
    var depth_loc = gl.getUniformLocation(program, "dept");
    gl.bindTexture(gl.TEXTURE_3D,current_tex);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,canvas.width,canvas.height);
    //step 
    function step() {
    	var my_settings = getSettings()
    	gl.uniform1f(depth_loc,my_settings.depth);
    	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    var animFrame;
	function frame() {
	  step();
	  animFrame = requestAnimationFrame(frame);
	}
	animFrame = requestAnimationFrame(frame);
}

var THETA = 0;
var PHI = 0;
var time_old = 0;


function drawVolumeCubes(gl,current_tex,DIMENSIONS,canvas,animate){
	var vsSource2 = document.getElementById("vs2").text.trim();
    var fsSource2 = document.getElementById("fs2").text.trim();
    var vertexShader2 = compShader(gl,vsSource2,gl.VERTEX_SHADER)
    var fragmentShader2 = compShader(gl,fsSource2,gl.FRAGMENT_SHADER)
	
    var program2 = makeProgram(gl,vertexShader2,fragmentShader2);

    gl.useProgram(program2);
    //cube of positions
    
    const INCREMENT = 1 / DIMENSIONS;
    let positionData = new Float32Array(DIMENSIONS * DIMENSIONS * DIMENSIONS * 3);

    let positionIndex = 0;
    let x = -0.5;
    for (let i = 0; i < DIMENSIONS; ++i) {
        let y = -0.5;
        for (let j = 0; j < DIMENSIONS; ++j) {
            let z = -0.5;
            for (let k = 0; k < DIMENSIONS; ++k) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
                positionData[positionIndex++] = z;
                z += INCREMENT;
            }
            y += INCREMENT;
        }
        x += INCREMENT;
    }
    gl.bindTexture(gl.TEXTURE_3D,current_tex);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
   	gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW,0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    var Pmatrix = gl.getUniformLocation(program2, "Pmatrix");
	var Vmatrix = gl.getUniformLocation(program2, "Vmatrix");
	var Mmatrix = gl.getUniformLocation(program2, "Mmatrix");

	var proj_matrix = get_projection(40, canvas.width/canvas.height, 1, 100);
	var mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
	var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

	//translating z
	view_matrix[14] = view_matrix[14]-1.7; //zoom
	//rotateX(mov_matrix,-1.1); 
	//rotateY(mov_matrix, 0.0);
	//rotateX(mov_matrix,-0.4);
	//rotateZ(mov_matrix, 0.3);

	//rotateZ(mov_matrix,0)
	gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
	gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
	gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
     // Enable the depth test
	gl.enable(gl.DEPTH_TEST);

	gl.clearDepth(1);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.depthFunc(gl.LESS);

	// Clear the color buffer bit
	gl.clear(gl.COLOR_BUFFER_BIT);

     // Set the view port
    gl.viewport(0,0,canvas.width,canvas.height);
    window.addEventListener('load',function(){
	    canvas.addEventListener("mousedown", mouseDown, false);
	    canvas.addEventListener("mouseup", mouseUp, false);
		canvas.addEventListener("mouseout", mouseUp, false);
		canvas.addEventListener("mousemove", mouseMove, false);
	});
    
	
    if(animate){
    	function step(time) {
	    	var dt = time-time_old;
	        if (!drag) {
	           dX *= AMORTIZATION, dY*=AMORTIZATION;
	           THETA+=dX, PHI+=dY;
	        }
	        reset_Mmatrix(mov_matrix);
	        rotateY(mov_matrix, THETA);
	        rotateX(mov_matrix, PHI);
	        time_old = time; 

	        gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
			gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
			gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
	    	gl.drawArrays(gl.POINTS, 0, DIMENSIONS * DIMENSIONS * DIMENSIONS);
	    	requstFrame = requestAnimationFrame(step);
	    }
	    requstFrame = requestAnimationFrame(step);
    }else{
    	rotateX(mov_matrix,-1.1);
    	gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
		gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
		gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
    	gl.drawArrays(gl.POINTS, 0, DIMENSIONS * DIMENSIONS * DIMENSIONS);
    }
    
}


//matrix functions

function reset_Mmatrix(mov_matrix){
	mov_matrix[0] = 1, mov_matrix[1] = 0, mov_matrix[2] = 0,
    mov_matrix[3] = 0,

    mov_matrix[4] = 0, mov_matrix[5] = 1, mov_matrix[6] = 0,
    mov_matrix[7] = 0,

    mov_matrix[8] = 0, mov_matrix[9] = 0, mov_matrix[10] = 1,
    mov_matrix[11] = 0,

    mov_matrix[12] = 0, mov_matrix[13] = 0, mov_matrix[14] = 0,
    mov_matrix[15] = 1;
}

function get_projection(angle, a, zMin, zMax) {
	var ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
	return [
	   0.5/ang, 0 , 0, 0,
	   0, 0.5*a/ang, 0, 0,
	   0, 0, -(zMax+zMin)/(zMax-zMin), -1,
	   0, 0, (-2*zMax*zMin)/(zMax-zMin), 0
	];
}

function rotateX(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1]*c-m[2]*s;
    m[5] = m[5]*c-m[6]*s;
    m[9] = m[9]*c-m[10]*s;

    m[2] = m[2]*c+mv1*s;
    m[6] = m[6]*c+mv5*s;
    m[10] = m[10]*c+mv9*s;
 }
function rotateY(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]+s*m[2];
    m[4] = c*m[4]+s*m[6];
    m[8] = c*m[8]+s*m[10];

    m[2] = c*m[2]-s*mv0;
    m[6] = c*m[6]-s*mv4;
    m[10] = c*m[10]-s*mv8;
 }
function rotateZ(m, angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv0 = m[0], mv4 = m[4], mv8 = m[8]; 

	m[0] = c*m[0]-s*m[1];
	m[4] = c*m[4]-s*m[5];
	m[8] = c*m[8]-s*m[9];
	m[1] = c*m[1]+s*mv0;
	m[5] = c*m[5]+s*mv4;
	m[9] = c*m[9]+s*mv8;
}

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

var mouseDown = function(e) {
	drag = true;
	old_x = e.pageX, old_y = e.pageY;
	e.preventDefault();
	return false;
};

var mouseUp = function(e){
	drag = false;
};

var mouseMove = function(e) {
if (!drag) return false;
	dX = (e.pageX-old_x)*2*Math.PI/canvas_width,
	dY = (e.pageY-old_y)*2*Math.PI/canvas_width;
	THETA+= dX;
	PHI+=dY;
	old_x = e.pageX, old_y = e.pageY;
	e.preventDefault();
};


//helper functions

function getSettings(){
	var my_settings = {};
	my_settings.depth = document.getElementById("mySlider").value;
	document.getElementById("myDepth").innerHTML  = my_settings.depth;
	return my_settings;
}

function newTexture(gl,init_state,dimension){
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_3D, texture);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA32F, dimension, dimension, dimension,0, gl.RGBA, gl.FLOAT, init_state);
	return texture;
}

function initialStateTest(dimension){
	//sphere
	var state = new Float32Array(4 * dimension * dimension*dimension);
	for(var z = 0;z<dimension;z++){
		for (var y=0; y<dimension; y++) {
		  for (var x=0; x<dimension; x++) {
		     var i = z*dimension*dimension + dimension*y + x;
		     var off_x = x - dimension/2;
		     var off_y = y - dimension/2;
		     var off_z = z - dimension/2;
		     	//var sphere = (x>=180 && x <=220 && y<=220&&y>=180)
		     	if(z<200){
		     		var sphere = ((off_x*off_x+off_y*off_y+off_z*off_z)<=201*201);
		     		if (sphere) {
			        state[4*i + 0] = 0.0;
			        state[4*i + 1] = 1.0;
			        
				     } else {
				        state[4*i + 0] = 1.0;
				        state[4*i + 1] = 0.0;
				     }
		     	}else{
		     		var sphere = ((off_x*off_x+off_y*off_y+off_z*off_z)<=201*201);
		     		if (sphere) {
		     			if(x<300){
		     				state[4*i + 0] = 0.0;
			        		state[4*i + 1] = 0.5;
		     			}else{
		     				state[4*i + 0] = 0.0;
			        		state[4*i + 1] = 0.3;
		     			}
			        
			        	if(y<200 && y>50){
			        		state[4*i + 0] = 1.0;
			        		state[4*i + 1] = 0.0;
			        	}
				     } else {
				        state[4*i + 0] = 1.0;
				        state[4*i + 1] = 0.0;
				     }
		     	}
			     
		     
		  }
		}
	}
	return state;
}


function initialState2D(dimension){
	//first layer has starting position
	var state = new Float32Array(4 * dimension * dimension*dimension);
	for(var z = 0;z<dimension;z++){
		for (var y=0; y<dimension; y++) {
			for (var x=0; x<dimension; x++) {
				var i = z*dimension*dimension + dimension*y + x;
				var offset = 10+Math.random()*25;
				if(z==0){
					var centr = (x>dimension/2-offset&&x<dimension/2+offset&&y>dimension/2-offset&&y<dimension/2+offset);
					if(centr){
						state[4*i + 0] = 0.5 + Math.random() * 0.05 - 0.01;
            			state[4*i + 1] = 0.25 + Math.random() * 0.15 - 0.01;
					}else{
						state[4*i+0] = 1.0;
						state[4*i+1] = 0.0;
					}
				}else{
					state[4*i+0] = 1.0;
					state[4*i+1] = 0.0;
				}
			 }
		}
	}
	return state;
}


function load_extensions(gl){
	var float_texture_ext = gl.getExtension("EXT_color_buffer_float");
   	if (!float_texture_ext) console.log("Your browser does not support the WebGL extension OES_texture_float");
   		window.float_texture_ext = float_texture_ext; 
   	var float_texture_ext_liner = gl.getExtension("OES_texture_float_linear");
   	if (!float_texture_ext_liner) console.log("Your browser does not support the WebGL extension OES_texture_float");
   		window.float_texture_ext_liner = float_texture_ext_liner; 
	
}

function compShader(gl,shaderSource,shaderType){
	var shadr = gl.createShader(shaderType);
    gl.shaderSource(shadr, shaderSource);
    gl.compileShader(shadr);	
	if (!gl.getShaderParameter(shadr, gl.COMPILE_STATUS)) {
	    console.error(gl.getShaderInfoLog(shadr));
	}
	return shadr;
}

function makeProgram(gl,vsShader,fsShader){
	var program = gl.createProgram();
	gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }
	return program;
}