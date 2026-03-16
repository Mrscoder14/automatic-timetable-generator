import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const maskTextRef = useRef<SVGTextElement>(null);
    const colorTextRef = useRef<SVGTextElement>(null);
    const whiteBgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    onComplete();
                }
            });

            // Initial State
            gsap.set(svgRef.current, { opacity: 0 }); // Hide SVG initially
            // Center drop using GSAP for proper transform origin handling
            gsap.set(dropRef.current, { xPercent: -50, rotation: -45 });

            // Step 1: Drop falls
            tl.to(dropRef.current, {
                y: '50vh',
                duration: 2.5,
                ease: 'bounce.out',
            })
                // Step 2: Squash
                .to(dropRef.current, {
                    scaleY: 0.6,
                    scaleX: 1.4,
                    duration: 0.4,
                    yoyo: true,
                    repeat: 1
                })
                // Step 3: Morph to Horizontal Line
                .to(dropRef.current, {
                    width: '400px', // Expand width
                    height: '10px',  // Flatten height
                    borderRadius: '10px',
                    rotation: 0,    // Reset rotation
                    scaleX: 1,      // Reset scale from squash
                    scaleY: 1,
                    duration: 0.5,
                    ease: 'power2.inOut'
                })
                // Phase 4: Pop Line into Text
                .to(dropRef.current, {
                    opacity: 0,
                    duration: 0.1,
                }, "+=0.1")
                .to(svgRef.current, {
                    opacity: 1,
                    duration: 0.1,
                    scale: 1.1, // Slight pop effect
                }, "<")
                .to(svgRef.current, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'back.out(1.7)'
                })

                // Fix Flicker: Remove DOM white bg ONLY after SVG is fully opaque
                // value ">" means "at the end of the most recently inserted tween"
                .to(whiteBgRef.current, { opacity: 0, duration: 0 }, ">")

                // Step 4: Zoom Text (Knockout Effect)
                .to([maskTextRef.current, colorTextRef.current], {
                    scale: 100, // Zoom out of screen
                    transformOrigin: '50% 50%', // Center zoom
                    duration: 4.5,
                    ease: 'power2.inOut',
                }, "+=0.1")
                // Fade out the RED overlay text to reveal the HOLE
                .to(colorTextRef.current, {
                    opacity: 0,
                    duration: 3.5,
                    ease: 'power2.inOut'
                }, "<+=0.2"); // Start fading red slightly after zoom starts

        }, containerRef);

        return () => ctx.revert();
    }, [onComplete]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Solid White BG for Drop Phase */}
            <div ref={whiteBgRef} className="absolute inset-0 bg-white z-0"></div>

            {/* Drop (DOM) */}
            <div
                ref={dropRef}
                className="w-6 h-6 bg-red-600 rounded-full rounded-tr-none absolute -top-10 left-1/2 shadow-lg shadow-red-200 z-10"
            ></div>

            {/* SVG Layer for Text Phase */}
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                viewBox="0 0 1920 1080"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <mask id="textMask">
                        {/* White Rect = Opaque */}
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {/* Black Text = Transparent Hole */}
                        <text
                            ref={maskTextRef}
                            x="50%"
                            y="50%"
                            dominantBaseline="middle"
                            textAnchor="middle"
                            fontSize="120"
                            fontWeight="900"
                            fontFamily="Outfit, sans-serif"
                            fill="black"
                        >
                            AISSMS
                        </text>
                    </mask>
                </defs>

                {/* White Background with Hole */}
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="white"
                    mask="url(#textMask)"
                />

                {/* Red Text Overlay (Fades out) */}
                <text
                    ref={colorTextRef}
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize="120"
                    fontWeight="900"
                    fontFamily="Outfit, sans-serif"
                    fill="#dc2626"
                >
                    AISSMS
                </text>
            </svg>
        </div>
    );
}
