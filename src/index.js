import _api from './api.js'

const createCanvas = (width, height) => {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return el
}

const bootstrap = () => {
  const canvas = createCanvas(640, 480)
  document.body.appendChild(canvas)
  const gl = canvas.getContext('webgl2')
  const api = _api(gl)
  console.log(api)

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT)

  const p = new api.Program(
    `
      #version 300 es

      in vec2 position;
      in vec2 tex_coord;

      uniform mat4 view_projection;

      void main() {
          gl_Position = view_projection * vec4(position, 0, 1);
      }
      `,
    `
      #version 300 es
      precision mediump float;

      out vec4 outColor;  // you can pick any name

      void main() {
         outColor = vec4(1, 1, 1, 1);
      }
      `
  )
}

window.onload = bootstrap
