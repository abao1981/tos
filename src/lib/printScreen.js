function printScreen(canvas_src) {
    var canvas_dst = document.createElement("canvas");
    canvas_dst.width = canvas_src.width;
    canvas_dst.height = canvas_src.height;

    var context = canvas_dst.getContext('2d');
    var sourceX = 0;
    var sourceY = 0;
    var sourceWidth = canvas_src.width;
    var sourceHeight = canvas_src.height;
    var destWidth = sourceWidth;
    var destHeight = sourceHeight;
    var destX = 0;
    var destY = 0;

    context.drawImage(canvas_src, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
    var img = canvas_dst.toDataURL("image/png");
    return img;
}