"""CUNCUN Fishing World: procedural human-proportioned rigged angler.
Run from Blender's Scripting workspace in a NEW .blend file.
Exports a rigged GLB with named animation clips for trial use only.
No network calls and no modification of the current scene/project.
"""
import bpy
import math
from mathutils import Vector

# Keep this asset isolated: script requires an empty Blender scene.
if bpy.data.objects:
    raise RuntimeError("Open a new empty Blender file before running this script.")
bpy.ops.object.armature_add(enter_editmode=False)
rig = bpy.context.object
rig.name = "CUNCUN_Angler_Rig"
rig.data.name = "CUNCUN_Angler_Skeleton"
bpy.ops.object.mode_set(mode='EDIT')
rig.data.edit_bones.remove(rig.data.edit_bones[0])

def bone(name, head, tail, parent=None):
    b=rig.data.edit_bones.new(name)
    b.head=head
    b.tail=tail
    if parent: b.parent=rig.data.edit_bones[parent]
    return b

bone("root",(0,0,.08),(0,0,.3))
bone("hips",(0,0,.9),(0,0,1.08),"root")
bone("spine",(0,0,1.08),(0,0,1.42),"hips")
bone("chest",(0,0,1.42),(0,0,1.63),"spine")
bone("neck",(0,0,1.63),(0,0,1.75),"chest")
bone("head",(0,0,1.75),(0,0,2.04),"neck")
for side,sign in (("L",1),("R",-1)):
    bone("upper_arm."+side,(sign*.24,0,1.55),(sign*.52,0,1.31),"chest")
    bone("forearm."+side,(sign*.52,0,1.31),(sign*.65,-.12,1.08),"upper_arm."+side)
    bone("hand."+side,(sign*.65,-.12,1.08),(sign*.68,-.2,1.01),"forearm."+side)
    bone("thigh."+side,(sign*.14,0,.98),(sign*.17,-.08,.55),"hips")
    bone("shin."+side,(sign*.17,-.08,.55),(sign*.17,-.06,.16),"thigh."+side)
    bone("foot."+side,(sign*.17,-.06,.16),(sign*.17,-.29,.1),"shin."+side)
bpy.ops.object.mode_set(mode='OBJECT')

def material(name, rgb):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgb,1)
    return m

skin=material("Skin",(0.55,.34,.23))
coat=material("Fishing jacket",(0.17,.29,.24))
vest=material("Fishing vest",(0.11,.20,.18))
trousers=material("Trousers",(0.12,.15,.16))
boots=material("Boots",(.07,.08,.08))
hat=material("Fishing cap",(.14,.21,.18))
metal=material("Rod carbon",(.035,.045,.05))
def ellipsoid(name, location, scale, mat, target):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=location)
    ob=bpy.context.object
    ob.name=name
    ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(mat)
    group=ob.vertex_groups.new(name=target)
    group.add(list(range(len(ob.data.vertices))),1.0,'REPLACE')
    mod=ob.modifiers.new("Armature","ARMATURE")
    mod.object=rig
    ob.parent=rig
    return ob

ellipsoid("Torso",(0,0,1.35),(.28,.16,.37),coat,"spine")
ellipsoid("Vest",(0,-.12,1.44),(.29,.085,.26),vest,"chest")
ellipsoid("Head",(0,-.01,1.86),(.115,.105,.17),skin,"head")
ellipsoid("Cap",(0,-.015,2.015),(.14,.125,.055),hat,"head")
ellipsoid("Hips",(0,0,.99),(.22,.15,.15),trousers,"hips")
for side,sign in (("L",1),("R",-1)):
    ellipsoid("UpperArm."+side,(sign*.39,0,1.43),(.105,.10,.19),coat,"upper_arm."+side)
    ellipsoid("Forearm."+side,(sign*.58,-.07,1.19),(.085,.09,.17),coat,"forearm."+side)
    ellipsoid("Hand."+side,(sign*.66,-.16,1.04),(.07,.06,.09),skin,"hand."+side)
    ellipsoid("Thigh."+side,(sign*.15,-.04,.76),(.13,.15,.27),trousers,"thigh."+side)
    ellipsoid("Shin."+side,(sign*.17,-.07,.36),(.105,.11,.22),trousers,"shin."+side)
    ellipsoid("Boot."+side,(sign*.17,-.15,.13),(.12,.22,.09),boots,"foot."+side)

# Rod held by right hand; can be repositioned during gameplay.
bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=.017,depth=2.8,location=(-.68,-1.35,1.5))
rod=bpy.context.object
rod.name="Fishing_Rod"
rod.rotation_euler[0]=math.radians(73)
rod.data.materials.append(metal)
g=rod.vertex_groups.new(name="hand.R")
g.add(list(range(len(rod.data.vertices))),1,'REPLACE')
mod=rod.modifiers.new("Armature","ARMATURE")
mod.object=rig
rod.parent=rig

# Separate named NLA actions, so GLB can expose gameplay animation clips.
def animate(name, poses):
    action=bpy.data.actions.new(name)
    rig.animation_data_create()
    rig.animation_data.action=action
    for frame, rotations in poses:
        for pb in rig.pose.bones:
            pb.rotation_mode='XYZ'
            pb.rotation_euler=(0,0,0)
        for key,xyz in rotations.items():
            rig.pose.bones[key].rotation_euler=tuple(math.radians(v) for v in xyz)
        for pb in rig.pose.bones:
            pb.keyframe_insert(data_path="rotation_euler",frame=frame,group=pb.name)
    action=rig.animation_data.action
    track=rig.animation_data.nla_tracks.new()
    track.name=name
    strip=track.strips.new(name,poses[0][0],action)
    strip.action_frame_start=poses[0][0]
    strip.action_frame_end=poses[-1][0]
    rig.animation_data.action=None

idle={"upper_arm.L":(-12,0,-14),"upper_arm.R":(-12,0,14)}
cast={"upper_arm.R":(-65,0,18),"forearm.R":(-28,0,0),"chest":(-7,0,0)}
fight={"upper_arm.R":(-45,0,14),"forearm.R":(-55,0,0),"upper_arm.L":(-30,0,-12),"forearm.L":(-40,0,0)}
walk_a={"thigh.L":(23,0,0),"thigh.R":(-23,0,0),"upper_arm.L":(-16,0,0),"upper_arm.R":(16,0,0)}
walk_b={"thigh.L":(-23,0,0),"thigh.R":(23,0,0),"upper_arm.L":(16,0,0),"upper_arm.R":(-16,0,0)}
sit={"thigh.L":(-75,0,0),"thigh.R":(-75,0,0),"shin.L":(75,0,0),"shin.R":(75,0,0)}
animate("Idle",[(1,idle),(20,{"chest":(2,0,0),**idle}),(40,idle)])
animate("Walk",[(1,walk_a),(12,walk_b),(24,walk_a)])
animate("Sit",[(1,{}),(20,sit)])
animate("Cast",[(1,idle),(12,cast),(26,idle)])
animate("Reel",[(1,fight),(12,{**fight,"forearm.R":(-30,0,0)}),(24,fight)])

for track in rig.animation_data.nla_tracks:
    track.mute=False
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//CUNCUN_Angler_Rig.blend"))
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//CUNCUN_Angler_Rig.glb"),
    export_format='GLB',use_selection=False,export_animations=True,
    export_nla_strips=True,export_apply=False
)
print("CUNCUN angler saved: .blend + .glb")
