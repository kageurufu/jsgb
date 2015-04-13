JSGB
====

Javascript Gameboy Emulator

Not trying for cycle-accurate emulation, cause fuck memory read timing

I'm planning for a basic Serial implementation, possibly over WebRTC (that would be sick)
or just serial dumping. Theres basic serial IO dumping to the console for output of Blargg's 
test roms, until I get the PPU actually working

Shouldnt be long, I just need to figure out why its only writing 0xFF to the gpu screen

Debugger
========

* No breakpoint support
* Exceptions in gb.cpu or gb.gpu steps cause failures in gb.frame()
* Some ugliness in debugger output (fix column spacing, maybe do some replace in mnemo?)
* Memory viewer would be nice
* Stack viewer would be awesome too
* Option to show GPU screenbuffer in second canvas
* Global onerror handler
* Better logging, something buffered preferrably, with PC
