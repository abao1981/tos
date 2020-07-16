export function aggregate(scene) {
    let meshes = 0, faces = 0, vertices = 0;
    scene.traverse(function (child) {
        if (child.isMesh) {
            if (child.geometry.isBufferGeometry) {
                meshes++;
                faces += child.geometry.attributes.position.array.length / 3;
                vertices += child.geometry.index.array.length / 3;
            }
            if (child.geometry.isGeometry) {
                meshes++;
                faces += child.geometry.faces.length;
                vertices += child.geometry.vertices.length
            }
            if (child.geometry.isInstancedBufferGeometry) {
                meshes += child.geometry.maxInstancedCount;
                faces += child.geometry.attributes.position.array.length * child.geometry.maxInstancedCount / 3;
                vertices += child.geometry.index.array.length * child.geometry.maxInstancedCount / 3;
            }
        }
    });
    return {
        meshes,
        faces,
        vertices
    }
}
