# %%
import time
import board
import neopixel

# %%
# setup main LED control parameters
pixel_pin = board.D12
num_pixels = 120
pixels = neopixel.NeoPixel(pixel_pin, num_pixels, brightness=0.2)

# %%

# test 1
# alles hell grün
col= (180, 30, 0)
col2= (200, 180, 0)
for i in range(pixels.n):
    pixels[i]= col2 if (i) % 5 == 0 else col

# %%
pixels.show()
time.sleep(0.1)

# %%
pixels[0]= pixels[15]= pixels[30]= pixels[45]= (10, 20, 200)
pixels.show()

# %%
