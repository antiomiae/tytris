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
      const componentType = getComponentType(attribInfo.type)
      const numComponents = getComponentSize(attribInfo.type)
      const valueArrayType = getArrayTypeForComponentType(componentType)

      out[attribInfo.name] = {
        name: attribInfo.name,
        size: attribInfo.size,
        type: attribInfo.type,
        componentType,
        valueArrayType,
        location,
        numComponents
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

    bind() {
      gl.useProgram(this._glProgram)
    }

    unbind() {
      gl.useProgram(null)
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
    }

    buildVao() {
      // maybe delete existing buffers here?
      this.buffers = {}

      if (this._glVao) {
        gl.deleteVertexArray(this._glVao)
      }

      this._glVao = gl.createVertexArray()
      gl.bindVertexArray(this._glVao)

      Object.keys(this.program.attributes).forEach(attrName => {
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        const attribute = this.program.attributes[attrName]
        console.log(`Attribute ${attrName} type = ${getGLConstantNames(attribute.type)}`)

        const componentType = getComponentType(attribute.type)

        gl.enableVertexAttribArray(attribute.location)
        getVertexAttribFuncForType(componentType)(attribute.location, getComponentSize(attribute.type), componentType, false, 0, 0)

        this.buffers[attrName] = {
          name: attrName,
          buffer,
          size: attribute.size,
          type: attribute.type
        }
      })

      this.indexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindVertexArray(null)
    }

    bind() {
      gl.bindVertexArray(this._glVao)
    }

    unbind() {
      gl.bindVertexArray(null)
    }

    loadBatch(batch) {
      const vertices = batch.getVertices()

      this.bind()

      for (let bufferObj of Object.values(this.buffers)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices[bufferObj.name], gl.STREAM_DRAW)
      }

      if (batch instanceof IndexedVertexBatch) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.getIndices(), gl.STREAM_DRAW)
      }
    }
  }

  class VertexBatch {
    constructor(attributes, maxVertices = 1000) {
      this.arrays = {}
      this.setters = {}
      this.attributes = attributes
      this.maxVertices = maxVertices

      Object.values(this.attributes).forEach(attributeInfo => {
        const numComponents = attributeInfo.numComponents
        const attrName = attributeInfo.name

        this.arrays[attrName] = new attributeInfo.valueArrayType(this.maxVertices * numComponents)

        this.setters[attrName] = (v) => {
          const baseIndex = this.currentVertex * numComponents
          for (let i = 0; i < numComponents; i++) {
            this.arrays[attrName][baseIndex + i] = v[i]
          }
        }
      })

      this.reset()

      this.attributeNames = Object.keys(this.arrays)
    }

    reset() {
      this.currentVertex = 0
    }

    addVertex(obj) {
      if (this.currentVertex >= this.maxVertices) {
        throw `This vertex batch is full`
      }

      this.attributeNames.forEach(attrName => {
        let val = null
        if (val = obj[attrName]) {
          this.setters[attrName](val)
        }
      })

      this.currentVertex += 1

      return this.currentVertex - 1
    }

    getVertices() {
      return this.attributeNames.reduce((out, attrName) => {
        out[attrName] = this.arrays[attrName].subarray(0, this.currentVertex * this.attributes[attrName].numComponents)
        return out
      }, {})
    }
  }

  class IndexedVertexBatch extends VertexBatch {
    /**
     *
     * @param {*} attributes
     * @param {*} primitiveSize The number of vertices per primitive (triangle = 3, line = 2, point = 1)
     */
    constructor(attributes, primitiveSize = 3, maxPrimitives = 1000) {
      super(attributes, primitiveSize * maxPrimitives)
      this.indices = new Uint16Array(primitiveSize * maxPrimitives)
      this.currentIndex = 0

      switch (primitiveSize) {
        case 3:
          this.glPrimitive = gl.TRIANGLES
          break
        case 2:
          this.primitiveSize = gl.LINES
          break
        case 1:
          this.primitiveSize = gl.POINTS
          break
      }

    }

    addPrimitives(vertices, indices) {
      const firstIndex = this.addVertices(vertices)
      const shiftedIndices = indices.map(i => i + firstIndex)
      for (let i = 0; i < shiftedIndices.length; ++i) {
        this.indices[i + this.currentIndex] = shiftedIndices[i]
      }
      this.currentIndex += shiftedIndices.length
    }

    addVertices(vertices) {
      const firstIndex = this.addVertex(vertices[0])

      if (vertices.length > 1) {
        for (let i = 1; i < vertices.length; ++i) {
          this.addVertex(vertices[i])
        }
      }

      return firstIndex
    }

    reset() {
      super.reset()
      this.currentIndex = 0
    }

    getIndices() {
      return this.indices.subarray(0, this.currentIndex)
    }
  }

  const drawBatch = (batch, vao) => {
    vao.loadBatch(batch)
    vao.bind()
    if (batch instanceof IndexedVertexBatch) {
      gl.drawElements(batch.glPrimitive, batch.currentIndex, gl.UNSIGNED_SHORT, 0)
    }
  }

  class Texture {
    static componentsForFormat(format) {
      switch (format) {
        case gl.RED:
        case gl.RED_INTEGER:
          1
          break
        case gl.RG:
        case gl.RG_INTEGER:
          2
          break
        case gl.RGA:
        case gl.RGA_INTEGER:
          3
          break
        case gl.RGBA:
        case gl.RGBA_INTEGER:
          4
          break
      } 
    }

    constructor(format, type, internalFormat) {
      this.type = type
      this.format = format
      this.internalFormat = internalFormat
      this.bufferType = getArrayTypeForComponentType(this.type)
      this.components = Texture.componentsForFormat(this.format)

      this.width = 0
      this.height = 0
    }
  }

  const logErrors = () => {
    let err;
    while ((err = gl.getError()) != gl.NO_ERROR) {
      console.log(`glError = ${err}`)
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
    Vao,
    VertexBatch,
    IndexedVertexBatch,
    Texture,
    drawBatch,
    logErrors
  }
}

export default api
