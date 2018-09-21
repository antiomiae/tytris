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
        componentType: getComponentType(attribInfo.type),
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

      case (gl.UNSIGNED_INT):
      case (gl.UNSIGNED_INT_VEC2):
      case (gl.UNSIGNED_INT_VEC3):
      case (gl.UNSIGNED_INT_VEC4):
        return gl.UNSIGNED_INT

    }
    throw `No component type for gl type ${glType}`

  }

  const getComponentSize = (glType) => {
    switch (glType) {
      case (gl.FLOAT):
      case (gl.INT):
      case (gl.UNSIGNED_INT):
      case (gl.SHORT):
      case (gl.UNSIGNED_SHORT):
        return 1

      case (gl.FLOAT_VEC2):
      case (gl.INT_VEC2):
      case (gl.UNSIGNED_INT_VEC2):
        return 2

      case (gl.FLOAT_VEC3):
      case (gl.INT_VEC3):
      case (gl.UNSIGNED_INT_VEC3):
        return 3

        // case (gl.FLOAT_MAT2):
        //   return 4

        // case (gl.FLOAT_MAT3):
        //   return 9

        // case (gl.FLOAT_MAT4):
        //   return 16

      case (gl.FLOAT_VEC4):
      case (gl.INT_VEC4):
      case (gl.UNSIGNED_INT_VEC4):
        return 4

    }

    throw `No size for gl type ${glType} ${getGLConstantNames(glType)}`
  }

  const getArrayTypeForComponentType = (glType) => {
    switch (glType) {
      case (gl.FLOAT):
        return Float32Array

      case (gl.INT):
        return Int32Array

      case (gl.UNSIGNED_INT):
        return Uint32Array

      case (gl.SHORT):
        return Int16Array

      case (gl.UNSIGNED_SHORT):
        return Uint16Array

      case (gl.BYTE):
        return Int8Array
      
      case (gl.UNSIGNED_BYTE):
        return Uint8Array
    }

    throw `No array type for gl type ${glType}`
  }

  const getVertexAttribFuncForType = (glType) => {
    switch (glType) {
      case (gl.FLOAT):
      case (gl.HALF_FLOAT):
        return gl.vertexAttribPointer.bind(gl)

      case (gl.INT):
      case (gl.UNSIGNED_INT):
      case (gl.SHORT):
      case (gl.UNSIGNED_SHORT):
      case (gl.BYTE):
      case (gl.UNSIGNED_BYTE):
        return gl.vertexAttribIPointer.bind(gl)
    }

    throw `No version of vertexAttribPointer defined for type ${glType}`
  }

  /**
   * Constructs Vertex Array Object with each attribute
   * @param {!Program} program
   */
  class Vao {
    constructor(program) {
      this.program = program
      this.buildVao()
      this.allocateVertices(2000)
    }

    buildVao() {
      // maybe delete existing buffers here?
      this.buffers = {}

      if (this.vao) {
        gl.deleteVertexArray(this.vao)
      }

      this.vao = gl.createVertexArray()
      gl.bindVertexArray(this.vao)

      Object.keys(this.program.attributes).forEach(attrName => {
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        const attribute = this.program.attributes[attrName]
        console.log(`Attribute ${attrName} type = ${getGLConstantNames(attribute.type)}`)

        const componentType = getComponentType(attribute.type)

        gl.enableVertexAttribArray(attribute.location)
        getVertexAttribFuncForType(componentType)(attribute.location, getComponentSize(attribute.type), componentType, false, 0, 0)

        this.buffers[attrName] = {
          buffer,
          valueArrayType: getArrayTypeForComponentType(getComponentType(attribute.type)),
          size: attribute.size,
          type: attribute.type
        }
      })

      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindVertexArray(null)
    }

    allocateVertices(count) {
      Object.values(this.buffers).forEach((bufferObject) => {
        bufferObject.valueArray = new bufferObject.valueArrayType(count * bufferObject.size)
      })
    }
  }

  return {
    compileShader,
    createProgram,
    enumerateUniforms,
    enumerateAttributes,
    getGLConstantNames,
    gl,
    Program,
    Vao
  }
}

export default api
