#version 300 es

in vec2 position;
in vec2 tex_coord;

out vec2 out_tex_coord;

uniform mat4 view_projection;

void main() {
    gl_Position = vec4(position, 0, 1);
    out_tex_coord = tex_coord;
}
