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
}

window.onload = bootstrap
