# ScreenToDMX
Web app to capture graphics and send portions out as DMX data for light control.

![{52E8515D-5062-4F01-A56D-693CAA8E64B5}](https://github.com/user-attachments/assets/721ac881-63f5-4e81-abe3-fea005b8baf5)


In the image a youtube audio visualisation is captured and sampled for DMX data output.

In the above image ScreenToDMX is used to capture the output screen of [Milkdrop](https://github.com/milkdrop2077/MilkDrop3). 4 lines each with 8 sampling points equaly spaced along the sampling line are sampled and their R,G B values are mapped to 72 DMX channels.

This DMX data can then be used to drive a wide range of real world DMX lighting equipment.

A few basic image control sliders allow you to change the color of the overall effect. Most notable is the blur effect because it softens the otherwise rapid color changes.

Try it here: https://beatline.xyz/stuff/screentodmx

The very latest code runs [here](https://dinther.github.io/ScreenToDMX/)
