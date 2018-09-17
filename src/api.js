const api = gl => {
  /**
   * Creates and compiles a shader.
   *
   * @param {string} shaderSource The GLSL source code for the shader.
   * @param {number} shaderType The type of shader, VERTEX_SHADER or
   *     FRAGMENT_SHADER.
   * @return {!WebGLShader} The shader.
   */
  const compileShader = (shaderSource, shaderType) => {
    // Create the shader object
    const shader = gl.createShader(shaderType)

    // Set the shader source code.
    gl.shaderSource(shader, shaderSource.trim())

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
  const createProgram = (vertexShader, fragmentShader) => {
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

  /**
   *
   * @param {!WebGLProgram} program
   * @return {!Object} Object describing
   */
  const enumerateUniforms = (program) => {
    const maxUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    const out = {}

    for (let i = 0; i < maxUniforms; i++) {
      const uniformInfo = gl.getActiveUniform(program, i)
      const location = gl.getUniformLocation(program, uniformInfo.name)

      out[uniformInfo.name] = {
        name: uniformInfo.name,
        size: uniformInfo.size,
        type: uniformInfo.type,
        location
      }
    }

    return out
  }

  /**
   *
   * @param {!WebGLProgram} program
   * @return {!Object} Object describing
   */
  const enumerateAttributes = (program) => {
    const maxAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    const out = {}

    for (let i = 0; i < maxAttributes; i++) {
      const attribInfo = gl.getActiveAttrib(program, i)
      const location = gl.getAttribLocation(program, attribInfo.name)

      out[attribInfo.name] = {
        name: attribInfo.name,
        size: attribInfo.size,
        type: attribInfo.type,
        location
      }
    }

    return out
  }

  const getGlConstantNames = (code) => {
    if (!getGlConstantNames.nameTable) {
      const m = new Map()
      getGlConstantNames.nameTable = m;

      const glConstantRegex = /[A-Z][A-Z_0-9]+/

      const props = Object.keys(WebGL2RenderingContext)

      props.forEach(prop => {
        const val = gl[prop]

        if (glConstantRegex.test(prop) && Number.isInteger(val)) {
          if (!m.has(val)) {
            m.set(val, [])
          }
          m.get(val).push(prop)
        }
      })
    }

    return getGlConstantNames.nameTable.get(code)
  }

  class Program {
    constructor(vertetxShaderSource, framgentShaderSource) {
      this._glProgram = createProgram(compileShader(vertetxShaderSource, gl.VERTEX_SHADER), compileShader(framgentShaderSource, gl.FRAGMENT_SHADER))
      this.attributes = enumerateAttributes(this._glProgram)
      this.uniforms = enumerateUniforms(this._glProgram)
    }
  }

  /**
   * Constructs Vertex Array Object with each attribute
   * @param {!WeGLlPogram} program
   */
  const buildVao = (program) => {

  }

  return {
    compileShader,
    createProgram,
    enumerateUniforms,
    enumerateAttributes,
    getGlConstantNames,
    gl,
    Program
  }
}

export default api
