# %%
import time
import board
import neopixel

from clock.botclock import BotClock
from clock.botAnimations import *

# %%
# setup clock
clock = BotClock()
clock.mode= 'clock'

# %%
# play some animation
c1= (50, 0, 0)
c2= (0, 150, 0)
clock.colorDrop(c1, c2)
# clock.colorWipe(c1)

# set some LEDs to specific color
clock.strip[0]= clock.strip[15]= clock.strip[30]= clock.strip[45]= (10, 20, 200)
clock.strip.show()
print(clock.strip.n)
# %%

# %%
