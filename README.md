# ScreenToDMX
Web app to capture graphics and send portions out as DMX data for light control.

![{03808776-58C8-41E3-9286-8804E29934D7}](https://github.com/user-attachments/assets/66bb2ac9-dad6-49f3-a35d-d91e8b56095b)
In the image a youtube audio visualisation is captured and sampled for DMX data output.

In the above image ScreenToDMX is used to capture the output screen of [Milkdrop](https://github.com/milkdrop2077/MilkDrop3). 4 lines each with 8 sampling points equaly spaced along the sampling line are sampled and their R,G B values are mapped to 72 DMX channels.

This DMX data can then be used to drive a wide range of real world DMX lighting equipment.

A few basic image control sliders allow you to change the color of the overall effect. Most notable is the blur effect because it softens the otherwise rapid color changes.

Try it here: https://beatline.xyz/stuff/screentodmx

The very latest code runs [here](https://dinther.github.io/ScreenToDMX/)
