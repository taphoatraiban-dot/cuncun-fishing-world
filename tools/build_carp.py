"""CUNCUN carp model generator. Run with Blender: blender -b -P tools/build_carp.py
Outputs assets/cuncun_carp_v1.glb. Free procedural geometry, no paid assets.
"""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.55):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
 return m
skin=material('olive gold carp scales',(.38,.48,.25));belly=material('pearl belly',(.78,.74,.52));finmat=material('translucent olive fins',(.31,.43,.26));eye=material('black glass eyes',(.015,.025,.013),.12)
def oval(name,loc,scale,mat,segments=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
 o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def fin(name,points,mat):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],[tuple(range(len(points)))]);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o
oval('carp torso',(0,0,0),(.9,.36,.3),skin)
oval('carp belly',(.1,-.15,0),(.66,.23,.27),belly)
oval('carp head',(.67,.05,0),(.32,.25,.235),skin)
oval('carp lips',(.94,-.07,0),(.1,.06,.12),belly)
for side in (-1,1):
 oval('eye '+str(side),(.81,.14,side*.21),(.055,.055,.027),eye,16,12)
 fin('pectoral fin '+str(side),[(.16,-.1,side*.25),(-.05,-.33,side*.67),(-.27,-.38,side*.56),(-.15,-.15,side*.24)],finmat)
 fin('barbel '+str(side),[(.94,-.13,side*.1),(1.07,-.23,side*.17),(1.02,-.2,side*.12)],finmat)
fin('dorsal fin',[(.22,.31,0),(-.21,.73,0),(-.58,.49,0),(-.49,.28,0)],finmat)
fin('tail fin',[(-.79,0,0),(-1.36,.55,0),(-1.21,.12,0),(-1.36,-.55,0)],finmat)
fin('anal fin',[(-.19,-.27,0),(-.5,-.54,0),(-.61,-.3,0)],finmat)
out=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','assets','cuncun_carp_v1.glb'))
os.makedirs(os.path.dirname(out),exist_ok=True)
bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_apply=True)
print('Exported:',out)
