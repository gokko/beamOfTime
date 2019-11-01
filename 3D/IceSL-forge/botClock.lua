-- bore_r = ui_scalar('bore radius',5,1,8)
-- bore_h = ui_scalar('bore height',10,5,30)
-- sides = math.floor(ui_scalar('sides',3,2,6))

do_log= true
function log(s)
  if do_log then
	print(s.."\n")
  end
end

function round(num) 
  if num >= 0 then return math.floor(num+.5) 
  else return math.ceil(num-.5) end
end

ledPerMeterIn = 100  -- 100
ledPerMeterOut = 100  --  96
ledStripWidth= 10
ledHeight= 2
ledWidth= 5
size= "L"  -- S or L
--log("size ".. size)
raspiModules= 1
--log("raspiModules ".. raspiModules)

ledDistIn = 1000/ ledPerMeterIn
log("ledDistIn ".. ledDistIn)
ledDistOut = 1000/ ledPerMeterOut
log("ledDistOut ".. ledDistOut)
ledR1= round(60* ledDistIn / Pi/ 2) - 0
log("ledR1 ".. ledR1)
ledR2= round(60* ledDistOut / Pi/ 2) + 0.5
log("ledR2 ".. ledR2)

r1= size== "L" and ledR2+ 7 or ledR1+ 5
log("r1 ".. r1)
h1= ledStripWidth+ 2
log("h1 ".. h1)
h2= h1+ 8+ raspiModules* 8
--log("h2 ".. h2)

stripWidth= 4
--log("stripWidth: ".. stripWidth)
hrStripDist= round((stripWidth+ 0.6)* 12/ Pi/ 2)+ 1
--log("hrStripDist: ".. hrStripDist)
hrStripLen= math.floor(ledR1- hrStripDist)
log("hrStripLen: ".. hrStripLen)
minStripDist= round((stripWidth+ 0.6)* 60/ Pi/ 2)
log("minStripDist: ".. minStripDist)
minStripLen= math.floor(ledR1- minStripDist)
log("minStripLen: ".. minStripLen)
secStripLen= minStripLen+ (hrStripLen- minStripLen)/ 2
log("secStripLen: ".. secStripLen)

function ring(r1, r2, h)
    return difference(
        cylinder(r1, h),
        cylinder(r2, h)
    )
end
--emit(ring(ledR2, ledR1, h1))

function makeRingOf(radius, count, item)
  local itemArr = {}
  for i= 1, count do
      angle= (i- 1)* 360/ count
      y= radius* sin(angle)
      x= radius* cos(angle)
      itemArr[i] = translate(x, y, 0)*
          rotate(0, 0, angle)* 
          item
  end
  return union(itemArr)
end

function raspiMount(dist)
  local raspiLen= 65
  local raspiWidth= 30
  local raspiHeight= 5
  local mount= 5
  local dist= dist== nil and 5 or dist
  local l= raspiLen+ 2* mount
  local w= raspiWidth+ 2* mount
  local h= raspiHeight+ dist
  return difference {
    cube(l, w, h),
    cube(l+2, w- 4* mount, h),
    cube(l- 4* mount, w, h),
    translate(0, 0, dist+ 1)* cube(raspiLen, raspiWidth, 2),
    translate(0, 0, dist+ 3)* cube(raspiLen- 0.8, raspiWidth- 0.5, 5)
  }
end
--emit(raspiMount(), 2)

function prism(l, l2, h, h2, t)
  local prism2d = { v(0, 0, h), v(-l2, 0, h),
          v(-l, 0, h2), v(-l, 0, 0), v(0, 0, 0) }
  local dir = v(0, t, 0)
  local res= translate(0, -t/2, 0)* linear_extrude(dir, prism2d)

  return res
end
--emit(prism(40, 5, 10, 1, 4), 2)

function minLedCutout()
  local radius= ledR1- 1
  local count= 60
  local w= ledWidth+ 1.5
  -- keep more space if same LED strip for inner and outer ring
  if ledPerMeterIn == ledPerMeterOut then
    w= w+ 0.5
  end
  local item= translate(0, 0, 1)* cube(ledHeight, w, h1)
  return makeRingOf(radius, count, item)
end
--emit(minLedCutout())

function secLedCutout()
  if size == "S" then
    return
  end
  local radius= ledR2+ 1
  local count= 60
  local w= ledWidth+ 1.5
  -- keep more space if same LED strip for inner and outer ring
  if ledPerMeterIn == ledPerMeterOut then
    w= w+ 0.5
  end
  local item= translate(0, 0, 1)* cube(ledHeight+ 0.2, w, h1)
  return makeRingOf(radius, count, item)
end
--emit(secLedCutout())

function hrStripCovers()
  local radius= ledR1- 2
  local count= 12
  local item= prism(hrStripLen+ 1, 5, h1, 2, stripWidth+ 2)
  return makeRingOf(radius, count, item)
end
--emit(hrStripCovers(), 2)

function hrStrips()
  local radius= ledR1- 2
  local count= 12
  local item= difference(prism(hrStripLen, 5, h1- 1, 1, stripWidth), cube(5, stripWidth, 1))

  return makeRingOf(radius, count, item)
end
--emit(hrStrips(), 2)

function minStrips()
  local radius= ledR1- 2
  local count= 60
  local item= difference(prism(minStripLen, 5, h1- 1, 1, stripWidth), cube(5, stripWidth, 1))

  return makeRingOf(radius, count, item)
end
--emit(minStrips(), 2)

function secStrip(single)
  local h= h1- 1
  local w= stripWidth
  if (single) then
    h= h- 0.5
    w= w- 0.5
  end

  local outer= rotate(0, 0, 180)* difference {
    union {
      prism(secStripLen, 5, h, 3, w+ 2),
    },
    translate(-0.8, 0, 0)* cube(5, w+ 3, 1),
  }
  local inner= rotate(0, 0, 180)* difference {
    union {
      prism(secStripLen- 1, 5, h- 1, 2, w),
      translate(-2.5, -w/2- 0.1, 0)* cube(5.0, 0.2, h- 1),
      translate(-2.5, w/2+ 0.1, 0)* cube(5.0, 0.2, h- 1),
    },
    translate(-2.5, 0, 0)* cube(5, w+ 3, 1)
  }
  local res= difference{
    outer,
    translate(3, -w/2- 1.4, 0)* cube(4, 1, h),
    translate(3, w/2+ 1.4, 0)* cube(4, 1, h),
  }

  if (single) then
    res= difference{
      res,
      difference {
        inner,
        translate(2.5, 0, 1)* cube(5, stripWidth+ 2, 1)
      },
    --translate(2.75, -w/2- 1.4, 0)* cube(4.6, 1, h),
    --translate(2.75, w/2+ 1.3, 0)* cube(4.6, 1, h),
    --translate(1.75, -w/2- 1.6, 0)* cube(4.5, 1.3, h),
    --translate(1.75, w/2+ 1.6, 0)* cube(4.5, 1.3, h),
    translate(4.5, 0, 0)* cube(3, w, 2.4),
    translate(1, 0, 0)* cube(5, w+ 3, 1),
    translate(0.8, 0, 0)* cube(5, w+ 3, 1),
    }
  end
  return res
end
--emit(translate(0, 10, 0)* secStrip(), 1)
--emit(secStrip(true), 2)

function secStripCutout()
  if size == "S" then
    return
  end
  local radius= ledR2+ 2
  local count= 60
  local item= secStrip()
  return makeRingOf(radius, count, item)
end
--emit(secStripCutout(), 2)

function cableCutout()
  return union(
        translate(0, -r1+ 3, h2- 2)* 
          rotate(90, 0, 0)* 
          cylinder(2, 5),
        translate(0, -r1, h2- 2)* cube(4, 5, 4)
      )
end
--emit(cableCutout(), 2)

function connectionCutout()
  cut= size == "L" and 8 or 3
  return union {
    translate(3, ledR2- 3, 7)* 
      rotate(90, 0, 90)* 
      difference(
        prism(r1- minStripDist- minStripLen/ 2, 0, 4, 1, h1)
        , rotate(0, 0, -15)* translate(0, -14, 0)* cube(r1- minStripDist+ 15, 15, 10)
      )
    , translate(5, ledR2- 2, 1)* cube(5, cut, h1)
  }
end
--emit(connectionCutout(), 2)

function airingCutout()
  local h= 10+ raspiModules* 10
  return translate(0, 0, h1)* union(
    rotate(0, 0, 45)* cube(r1* 2+ 10, 70, h),
    rotate(0, 0, -45)* cube(r1* 2+ 10, 70, h)
  )
end
--emit(airingCutout(), 2)

function wallMount()
  local h= h1+ 1+ raspiModules* 8
  return translate(0, r1- 8, h)* 
    difference {
    translate(0, 10, 0)* cylinder(14, 7),
    translate(0, -r1+ 8, 0)* ring(r1+ 20, r1, 10),
    translate(0, 4, -7)*
      rotate(45, 0, 0)*
      cube(30, 10, 20),
    translate(0, 4, -4)* 
      rotate(90, 0, 0)*
      cylinder(10, 10),
    translate(0, -2, 0)* 
      rotate(0, 0, 0)*
      cylinder(3, 10)
  }
end
--emit(wallMount(), 2)

function partCut(body, size)
  if size== nil then
    return body
  end
  if size== "R" then
    return difference{
      body,
      translate(0, 0, 10)* cylinder(r1, h2),
      cylinder(r1- 11, h2),
      difference(cylinder(r1, h2), cylinder(r1-3, h2))
    }
  end
  w= 17
  items= {}
  cyl= cylinder(42, h2)
  if size== "S" then
    w= 35
    items[0]= translate(0, r1- 82, 0)*
                cube(r1* 2+ 10, r1+ 70, h2)
    cyl= translate(0, 0, 100)* cylinder(1, 1)
  end
  if size== "M" then
    items[0]= translate(0, r1/2, 0)*
                cube(r1* 2+ 10, r1+ 10, h2)
  end
  if size== "L" then
    w= 7
  end
  items[1]= translate(r1- w, 0, 0)* cube(r1, r1* 2+ 10, h2)
  items[2]= translate(-r1+ w, 0, 0)* cube(r1, r1* 2+ 10, h2)
  cut= difference {
    union(items)
    , cyl
  }
  -- rotate body to get upper area printed as part
  body = rotate(0, 0, 180)* body
  return difference(body, cut)
end
--emit(partCut("M"), 2)

ledBandCutout= ring(ledR1+ 1.5, ledR1- 0.5, h1)
if (size== 'L') then
  ledBandCutout= union {
    ledBandCutout,
    ring(ledR2+ 0.7, ledR2- 1.2, h1)
  }
end
--emit(ledBandCutout, 2)

body = 
  difference {
    union {
      -- base body
      difference {
        cylinder(r1, h2)
        -- cutout to allow raspi and wall mount
        , translate(0, 0, h1)* cylinder(r1- 2, h2- h1)
        -- cutout further empty space in back
        , translate(0, 0, 2)* cone(ledR1- minStripLen- 3, ledR1- ledHeight+ 2, h1)
        , translate(0, 0, 1)* cylinder(ledR1- minStripLen- 3, 5)
        -- cutout of sides for airing
        , airingCutout()
      }
      -- additional covers for hour strips
    , hrStripCovers()
      -- wall mount
      , wallMount()
      -- raspi mount
      , raspiMount(6)
    }
    -- all cutouts
    -- space for LED bands
    , translate(0, 0, 1)* ledBandCutout
    -- space for LEDs
    , minLedCutout()
    , secLedCutout()
    -- space for hand strips
    , hrStrips()
    , minStrips()
    , secStripCutout()
    -- other cutouts
    , cableCutout()
    , connectionCutout()
}
--emit(secStripCutout(), 2)

function alignment(back, strip)
  local r1= r1
  local t= 0
  if partSize == 'S' then
    t= -85
    r1= 35
  end
  if partSize == 'M' then
    t= -35
    r1= 80
  end
  x= -r1+ 5
  y= -r1+ 5
  if (back) then
    x= r1- 5
    y= r1- 5
  end
  res= translate(x, y, 0.3)* rotate(90, 0, 90)* prism(10, 0, 10, 0, 0.6)
  res= translate(x, y, 0)* difference {
    cube(10, 10, 0.4),
    translate(-3.5, 3.5, 0)* rotate(0, 0, 45)* cube(15, 10, 0.4)
  }
  if (strip) then
    res = difference(translate(x, y, 0)* cube(10, 10, 0.4), res)
  end
  return translate(0, t, 0)* res
end


--partSize= "R"   -- S/M/L/R/nil

innerStrips= union(hrStrips(), minStrips())
finalBody= partCut(body, partSize)

-- cut strips to 0,4mm height to print with other filament
finalStrips= difference{
  innerStrips,
  translate(0, 0, 0.4)* cylinder(r1, h1),
  partCut(part)
}
finalSecStrip= translate(secStripLen/2+ 1.1, 0, 0)* cube(secStripLen- 4.1, stripWidth+ 1, 0.4)


emit(union{finalBody, alignment(false, false), alignment(true, false)})
--emit(union{finalStrips, alignment(false, true), alignment(true, true)}, 2)
--emit(finalSecStrip, 1)
--emit(secStrip(true), 2)
