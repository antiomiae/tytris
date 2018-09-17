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

  const getGLConstantNames = (code) => {
    if (!getGLConstantNames.nameTable) {
      const m = new Map()
      getGLConstantNames.nameTable = m;

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

    return getGLConstantNames.nameTable.get(code)
  }

  class Program {
    constructor(vertetxShaderSource, framgentShaderSource) {
      this._glProgram = createProgram(compileShader(vertetxShaderSource, gl.VERTEX_SHADER), compileShader(framgentShaderSource, gl.FRAGMENT_SHADER))
      this.attributes = enumerateAttributes(this._glProgram)
      this.uniforms = enumerateUniforms(this._glProgram)
    }

    setUniform(name) {
      if (!this.uniforms[name]) {
        throw `Program: No active uniform named ${name} in program`
      }


    }
  }

  const getComponentType = (glType) => {
    switch (glType) {
      case (gl.FLOAT):
      case (gl.FLOAT_VEC2):
      case (gl.FLOAT_VEC3):
      case (gl.FLOAT_VEC4):
      case (gl.FLOAT_MAT2):
      case (gl.FLOAT_MAT3):
      case (gl.FLOAT_MAT4):
        return gl.FLOAT

      case (gl.BOOL):
      case (gl.BOOL_VEC2):
      case (gl.BOOL_VEC3):
      case (gl.BOOL_VEC4):
        return gl.BOOL

      case (gl.INT):
      case (gl.INT_VEC2):
      case (gl.INT_VEC3):
      case (gl.INT_VEC4):
        return gl.INT

    }
  }

  /**
   * Constructs Vertex Array Object with each attribute
   * @param {!Program} program
   */
  const buildVao = (program) => {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const out = {
      vao,
      buffers: {}
    }

    Object.keys(program.attributes).forEach(attrName => {
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

      const attribute = program.attributes[attrName]
      console.log(`Attribute ${attrName} type = ${getGLConstantNames(attribute.type)}`)

      gl.enableVertexAttribArray(attribute.location)
      gl.vertexAttribPointer(attribute.location, attribute.size, getComponentType(attribute.type), false, 0, 0)

      out.buffers[attrName] = buffer
    });

    return out
  }

  return {
    compileShader,
    createProgram,
    enumerateUniforms,
    enumerateAttributes,
    getGLConstantNames,
    gl,
    Program,
    buildVao
  }
}

export default api
