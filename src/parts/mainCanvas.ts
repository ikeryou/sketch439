import { Color, CylinderGeometry, DirectionalLight, Mesh, MeshPhongMaterial, Object3D, PlaneGeometry, ShaderMaterial } from "three"
import { Canvas } from "../webgl/canvas"
import { Conf } from "../core/conf"
import { Update } from "../libs/update"
import { Func } from "../core/func"
import { Capture } from "../webgl/capture"
import { DestShader } from "../glsl/destShader"
import { Util } from "../libs/util"
import { MousePointer } from "../core/mousePointer"


export class MainCanvas extends Canvas {

  private _con: Object3D
  private _scene: Array<Capture> = []
  private _sceneCon: Array<Object3D> = []
  private _item: Array<Mesh> = []
  private _dest: Array<Mesh> = []
  private _light: Array<DirectionalLight> = []
  private _lightAng: Array<number> = []

  private _now: number = 1
  private _table: Array<any> = [
    [1,1,1,0,1,1,1,],
    [0,1,0,0,1,0,0,],
    [1,1,0,1,0,1,1,],
    [1,1,0,1,1,0,1,],
    [0,1,1,1,1,0,0,],
    [1,0,1,1,1,0,1,],
    [1,0,1,1,1,1,1,],
    [1,1,1,0,1,0,0,],
    [1,1,1,1,1,1,1,],
    [1,1,1,1,1,0,1,],
  ]

  constructor(opt: any) {
    super(opt)


    this._con = new Object3D()
    this.mainScene.add(this._con)

    const num = this._table[0].length
    for(let i = 0; i < num; i++) {
      const scene = new Capture()
      this._scene.push(scene)

      const light = new DirectionalLight(0xffffff, 1)
      scene.add(light)
      this._light.push(light)
      this._lightAng.push(0)

      const sceneCon = new Object3D()
      scene.add(sceneCon)
      this._sceneCon.push(sceneCon)

      const item = new Mesh(
        new CylinderGeometry(Util.random(0.1, 0.75), Util.random(0.1, 0.75), 1, Util.randomInt(4, 64), 20),
        // new CapsuleGeometry(0.5, 0.5, 4, 4),
        // new BoxGeometry(1,1,1,32,32,32),
        new MeshPhongMaterial({
          color: new Color(0,0,0).offsetHSL(Util.random(0, 1), 1, 0.5),
          transparent: true,
          emissive: 0x000000,
          specular: new Color(0,0,0).offsetHSL(Util.random(0, 1), 1, 0.5),
          // side: DoubleSide,
          // wireframe: true,
          flatShading: true,
        })
      )
      sceneCon.add(item)
      this._item.push(item)

      const dest = new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          vertexShader: DestShader.vertexShader,
          fragmentShader: DestShader.fragmentShader,
          transparent: true,
          uniforms: {
            tDiffuse: { value: scene.texture() },
            alpha: { value: 1 },
          },
        }),
      )
      this._con.add(dest)
      this._dest.push(dest)
    }

    this._resize()
  }


  protected _update(): void {
    super._update()

    const sw = Conf.CANVAS_SIZE.width
    const sh = Conf.CANVAS_SIZE.height

    if(this._c % 60 === 0) {
      this._now++
      if(this._now >= this._table.length) this._now = 0
    }

    const itemW = sw * 0.1
    const itemH = sh * 0.35
    const margin = sh * 0.15

    this._item.forEach((item, i) => {

      const con = this._sceneCon[i]

      const angRange = 60
      con.rotation.y = Util.radian(MousePointer.instance.easeNormal.x * angRange)
      con.rotation.x = Util.radian(MousePointer.instance.easeNormal.y * angRange)

      if(i == 0 || i == 3 || i == 6) {
        item.scale.set(itemW, itemH - margin, itemW)
      } else {
        item.scale.set(itemW, itemH - margin * 0.1, itemW)
      }

      if(i === 0) {
        item.rotation.z = Util.radian(90)
        item.position.y = itemH - itemW * 0.5
      }

      if(i === 1) {
        item.rotation.z = Util.radian(0)
        item.position.x = itemH * 0.5
        item.position.y = itemH * 0.5
      }

      if(i === 2) {
        item.rotation.z = Util.radian(0)
        item.position.x = -itemH * 0.5
        item.position.y = itemH * 0.5
      }

      if(i === 3) {
        item.rotation.z = Util.radian(90)
        item.position.x = itemH * 0
        item.position.y = itemH * 0
      }

      if(i === 4) {
        item.rotation.z = Util.radian(0)
        item.position.x = itemH * 0.5
        item.position.y = itemH * -0.5
      }

      if(i === 5) {
        item.rotation.z = Util.radian(0)
        item.position.x = -itemH * 0.5
        item.position.y = itemH * -0.5
      }

      if(i === 6) {
        item.rotation.z = Util.radian(90)
        item.position.x = itemH * 0
        item.position.y = itemH * -1 + itemW * 0.5
      }
    })

    const table = this._table[this._now]
    this._light.forEach((light, i) => {

      this._lightAng[i] += ((table[i] === 1 ? 0 : 180) - this._lightAng[i]) * 0.1
      const rad = Util.radian(this._lightAng[i])
      const radius = sw * 0.5
      const baseItem = this._item[i]
      if(i == 0 || i == 3 || i == 6) {
        light.position.y = baseItem.position.y + Math.sin(rad) * radius
        light.position.z = Math.cos(rad) * radius
        light.position.x = baseItem.position.x
      } else {
        light.position.x = baseItem.position.x + Math.sin(rad) * radius
        light.position.z = Math.cos(rad) * radius
        light.position.y = baseItem.position.y
      }

      // light.lookAt(baseItem.position)
    })

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }

  private _render(): void {
    this._scene.forEach((scene) => {
      this.renderer.setClearColor(0xffffff, 0)
      scene.render(this.renderer, this.cameraPers)
    })

    this.renderer.setClearColor(0x000000, 1)
    this.renderer.render(this.mainScene, this.cameraPers)
  }

  public isNowRenderFrame(): boolean {
    const it = 1
    return Update.instance.cnt % it == 0 && this.isRender
  }

  _resize(): void {
    super._resize();

    const sw = Conf.CANVAS_SIZE.width
    const sh = Conf.CANVAS_SIZE.height
    const pixelRatio: number = Func.ratio()

    this._scene.forEach((scene) => {
      scene.setSize(sw, sh, pixelRatio)
    })

    this._dest.forEach((dest) => {
      dest.scale.set(sw, sh, 1)
    })

    this.cameraPers.fov = 45
    this._updatePersCamera(this.cameraPers, sw, sh)

    this.renderSize.width = sw;
    this.renderSize.height = sh;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(sw, sh);
  }
}
