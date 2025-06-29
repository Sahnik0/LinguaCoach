"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

interface SpaceBackgroundProps {
  intensity?: number
  className?: string
}

export function SpaceBackground({ intensity = 0.3, className = "" }: SpaceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.PerspectiveCamera | null
    renderer: THREE.WebGLRenderer | null
    composer: EffectComposer | null
    stars: THREE.Points[]
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const { current: refs } = sceneRef

    // Scene setup
    refs.scene = new THREE.Scene()
    refs.scene.fog = new THREE.FogExp2(0x000000, 0.0005)

    // Camera
    refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    refs.camera.position.z = 100

    // Renderer
    refs.renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })
    refs.renderer.setSize(window.innerWidth, window.innerHeight)
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    refs.renderer.toneMapping = THREE.ACESFilmicToneMapping
    refs.renderer.toneMappingExposure = intensity

    // Post-processing
    refs.composer = new EffectComposer(refs.renderer)
    const renderPass = new RenderPass(refs.scene, refs.camera)
    refs.composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.2, 0.8)
    refs.composer.addPass(bloomPass)

    // Create stars
    const createStars = () => {
      const starCount = 3000
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)
      const sizes = new Float32Array(starCount)

      for (let i = 0; i < starCount; i++) {
        const radius = 200 + Math.random() * 800
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)

        const color = new THREE.Color()
        const colorChoice = Math.random()
        if (colorChoice < 0.7) {
          color.setHSL(0, 0, 0.8 + Math.random() * 0.2)
        } else if (colorChoice < 0.9) {
          color.setHSL(0.08, 0.5, 0.8)
        } else {
          color.setHSL(0.6, 0.5, 0.8)
        }

        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
        sizes[i] = Math.random() * 2 + 0.5
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = color;
            vec3 pos = position;
            
            float angle = time * 0.02;
            mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            pos.xy = rot * pos.xy;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(vColor, opacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const stars = new THREE.Points(geometry, material)
      refs.scene?.add(stars)
      refs.stars.push(stars)
    }

    createStars()

    // Animation loop
    const animate = () => {
      refs.animationId = requestAnimationFrame(animate)
      const time = Date.now() * 0.001

      refs.stars.forEach((starField) => {
        if (starField.material.uniforms) {
          starField.material.uniforms.time.value = time
        }
      })

      if (refs.composer) {
        refs.composer.render()
      }
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (refs.camera && refs.renderer && refs.composer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight
        refs.camera.updateProjectionMatrix()
        refs.renderer.setSize(window.innerWidth, window.innerHeight)
        refs.composer.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId)
      }
      window.removeEventListener("resize", handleResize)

      // Cleanup
      refs.stars.forEach((starField) => {
        starField.geometry.dispose()
        starField.material.dispose()
      })
      if (refs.renderer) {
        refs.renderer.dispose()
      }
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ pointerEvents: "none" }}
    />
  )
}
