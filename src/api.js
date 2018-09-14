const api = gl => {
  /**
   * Creates and compiles a shader.
   *
   * @param {string} shaderSource The GLSL source code for the shader.
   * @param {number} shaderType The type of shader, VERTEX_SHADER or
   *     FRAGMENT_SHADER.
   * @return {!WebGLShader} The shader.
   */
  function compileShader(shaderSource, shaderType) {
    // Create the shader object
    const shader = gl.createShader(shaderType)

    // Set the shader source code.
    gl.shaderSource(shader, shaderSource)

    // Compile the shader
    gl.compileShader(shader)

    // Check if it compiled
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!success) {
      // Something went wrong during compilation; get the error
      throw "could not compile shader:" + gl.getShaderInfoLog(shader)
    }

    return shader
  }

  /**
   * Creates a program from 2 shaders.
   *
   * @param {!WebGLShader} vertexShader A vertex shader.
   * @param {!WebGLShader} fragmentShader A fragment shader.
   * @return {!WebGLProgram} A program.
   */
  function createProgram(vertexShader, fragmentShader) {
    // create a program.
    const program = gl.createProgram()

    // attach the shaders.
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)

    // link the program.
    gl.linkProgram(program)

    // Check if it linked.
    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!success) {
      // something went wrong with the link
      throw "program filed to link:" + gl.getProgramInfoLog(program)
    }

    return program
  }

  return {
    compileShader,
    createProgram
  }
}

export default api
