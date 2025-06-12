<script lang="ts">
    interface Props {
        primaryColor?: string;
        secondaryColor?: string;
        bgColorLight?: string;
        bgColorDark?: string;
        animationSpeed?: number
        nodeSize?: number
        opacity?: number
        density?: number
    }

    let {
        primaryColor = "#2b75ed",
        secondaryColor = "#1a5cc5",
        bgColorLight = "#f8fafc",
        bgColorDark = "#f1f5f9",
        animationSpeed = 1,
        nodeSize = 1,
        opacity = 1,
        density = 1
    }: Props = $props()
    
    const showAllElements = density >= 0.8;
    const showMediumElements = density >= 0.5;
</script>

<svg xmlns="http://www.w3.org/2000/svg" 
    width="100%" 
    height="100%" 
    viewBox="0 0 1000 1000" 
    preserveAspectRatio="xMidYMid slice"
    style="--primary-color: {primaryColor}; 
           --secondary-color: {secondaryColor};
           --bg-color-light: {bgColorLight}; 
           --bg-color-dark: {bgColorDark};
           --animation-speed: {animationSpeed};
           --node-size: {nodeSize};
           --opacity: {opacity};">
    <defs>
        <!-- Subtle background gradient -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--bg-color-light)" />
            <stop offset="100%" stop-color="var(--bg-color-dark)" />
        </linearGradient>
        
        <!-- Encryption pattern -->
        <pattern id="encryptionGrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="none"/>
            <circle cx="25" cy="25" r="1" fill="var(--primary-color)" opacity="0.2"/>
            <circle cx="0" cy="0" r="1" fill="var(--primary-color)" opacity="0.1"/>
            <circle cx="0" cy="50" r="1" fill="var(--primary-color)" opacity="0.1"/>
            <circle cx="50" cy="0" r="1" fill="var(--primary-color)" opacity="0.1"/>
            <circle cx="50" cy="50" r="1" fill="var(--primary-color)" opacity="0.1"/>
        </pattern>
        
        <!-- Glows and filters -->
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <mask id="fadeBottom">
            <rect width="100%" height="100%" fill="white" />
            <rect x="0" y="750" width="100%" height="250" fill="url(#fadeGradient)" />
        </mask>
        
        <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="black" />
            <stop offset="100%" stop-color="white" />
        </linearGradient>
        
        <!-- Connection path animation -->
        <linearGradient id="dataPath" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--primary-color)" stop-opacity="0.05" />
            <stop offset="50%" stop-color="var(--primary-color)" stop-opacity="0.2" />
            <stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0.05" />
        </linearGradient>
    </defs>
    
    <!-- Base background -->
    <rect width="100%" height="100%" fill="url(#bgGradient)" />
    <rect width="100%" height="100%" fill="url(#encryptionGrid)" opacity="calc(0.5 * var(--opacity))" />
    
    <!-- Secure network visualization -->
    <g mask="url(#fadeBottom)">
        <!-- Encryption path network -->
        <g class="encryption-network">
            <!-- Horizontal data paths - always show at least 3 -->
            <path d="M0,350 L1000,350" class="data-path path1" stroke="url(#dataPath)" stroke-width="1.5" />
            <path d="M0,550 L1000,570" class="data-path path3" stroke="url(#dataPath)" stroke-width="1.5" />
            <path d="M0,750 L1000,770" class="data-path path5" stroke="url(#dataPath)" stroke-width="1.5" />
            
            <!-- Show these only with medium density -->
            {#if showMediumElements}
                <path d="M0,450 L1000,430" class="data-path path2" stroke="url(#dataPath)" stroke-width="1.5" />
                <path d="M0,650 L1000,630" class="data-path path4" stroke="url(#dataPath)" stroke-width="1.5" />
            {/if}
            
            <!-- Router paths - always show at least 2 -->
            <path d="M150,350 Q250,400 150,450 T150,550 T150,650" class="router router1" 
                stroke="var(--primary-color)" stroke-opacity="0.15" stroke-width="2" fill="none" />
            <path d="M750,350 Q850,400 750,450 T750,550 T750,650" class="router router4" 
                stroke="var(--primary-color)" stroke-opacity="0.15" stroke-width="2" fill="none" />
            
            <!-- Show these with increasing density -->
            {#if showMediumElements}
                <path d="M550,350 Q650,400 550,450 T550,550 T550,650" class="router router3" 
                    stroke="var(--primary-color)" stroke-opacity="0.15" stroke-width="2" fill="none" />
            {/if}
            {#if showAllElements}
                <path d="M350,350 Q450,400 350,450 T350,550 T350,650" class="router router2" 
                    stroke="var(--primary-color)" stroke-opacity="0.15" stroke-width="2" fill="none" />
                <path d="M950,350 Q1050,400 950,450 T950,550 T950,650" class="router router5" 
                    stroke="var(--primary-color)" stroke-opacity="0.15" stroke-width="2" fill="none" />
            {/if}
            
            <!-- Security nodes - always show core nodes -->
            <g class="nodes" filter="url(#glow)">
                <!-- Key security points - minimum set -->
                <circle cx="150" cy="350" r="{4 * nodeSize}" class="node node1" fill="var(--primary-color)" />
                <circle cx="150" cy="550" r="{3 * nodeSize}" class="node node3" fill="var(--primary-color)" />
                <circle cx="750" cy="450" r="{4 * nodeSize}" class="node node14" fill="var(--primary-color)" />
                <circle cx="750" cy="650" r="{4 * nodeSize}" class="node node16" fill="var(--primary-color)" />
                
                <!-- Medium density nodes -->
                {#if showMediumElements}
                    <circle cx="150" cy="450" r="{3.5 * nodeSize}" class="node node2" fill="var(--primary-color)" />
                    <circle cx="150" cy="650" r="{4 * nodeSize}" class="node node4" fill="var(--primary-color)" />
                    <circle cx="550" cy="350" r="{4 * nodeSize}" class="node node9" fill="var(--primary-color)" />
                    <circle cx="550" cy="550" r="{4 * nodeSize}" class="node node11" fill="var(--primary-color)" />
                    <circle cx="750" cy="350" r="{3.5 * nodeSize}" class="node node13" fill="var(--primary-color)" />
                    <circle cx="750" cy="550" r="{3 * nodeSize}" class="node node15" fill="var(--primary-color)" />
                {/if}
                
                <!-- Full density nodes -->
                {#if showAllElements}
                    <circle cx="350" cy="350" r="{3 * nodeSize}" class="node node5" fill="var(--primary-color)" />
                    <circle cx="350" cy="450" r="{4 * nodeSize}" class="node node6" fill="var(--primary-color)" />
                    <circle cx="350" cy="550" r="{3.5 * nodeSize}" class="node node7" fill="var(--primary-color)" />
                    <circle cx="350" cy="650" r="{3 * nodeSize}" class="node node8" fill="var(--primary-color)" />
                    <circle cx="550" cy="450" r="{3 * nodeSize}" class="node node10" fill="var(--primary-color)" />
                    <circle cx="550" cy="650" r="{3.5 * nodeSize}" class="node node12" fill="var(--primary-color)" />
                    <circle cx="950" cy="350" r="{3 * nodeSize}" class="node node17" fill="var(--primary-color)" />
                    <circle cx="950" cy="450" r="{3.5 * nodeSize}" class="node node18" fill="var(--primary-color)" />
                    <circle cx="950" cy="550" r="{4 * nodeSize}" class="node node19" fill="var(--primary-color)" />
                    <circle cx="950" cy="650" r="{3 * nodeSize}" class="node node20" fill="var(--primary-color)" />
                {/if}
            </g>
            
            <!-- Data packets - essential packets -->
            <g class="data-packets">
                <circle cx="100" cy="350" r="2.5" class="packet p1" fill="var(--primary-color)" opacity="0.7" />
                <circle cx="500" cy="350" r="2.5" class="packet p5" fill="var(--primary-color)" opacity="0.7" />
                <circle cx="700" cy="550" r="2.5" class="packet p7" fill="var(--primary-color)" opacity="0.7" />
                
                <!-- Medium density packets -->
                {#if showMediumElements}
                    <circle cx="300" cy="550" r="2.5" class="packet p3" fill="var(--primary-color)" opacity="0.7" />
                    <circle cx="800" cy="650" r="2" class="packet p8" fill="var(--primary-color)" opacity="0.7" />
                {/if}
                
                <!-- Full density packets -->
                {#if showAllElements}
                    <circle cx="200" cy="450" r="2" class="packet p2" fill="var(--primary-color)" opacity="0.7" />
                    <circle cx="400" cy="650" r="2" class="packet p4" fill="var(--primary-color)" opacity="0.7" />
                    <circle cx="600" cy="450" r="2" class="packet p6" fill="var(--primary-color)" opacity="0.7" />
                    <circle cx="900" cy="350" r="2.5" class="packet p9" fill="var(--primary-color)" opacity="0.7" />
                {/if}
            </g>
            
            <!-- Binary/encryption particles -->
            {#if showMediumElements}
                <g class="encryption-bits">
                    <text x="180" y="380" class="encryption-text bit1" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">10</text>
                    <text x="580" y="580" class="encryption-text bit3" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">10</text>
                    <text x="780" y="680" class="encryption-text bit4" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">01</text>
                    
                    {#if showAllElements}
                        <text x="380" y="480" class="encryption-text bit2" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">01</text>
                        <text x="240" y="420" class="encryption-text bit5" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">10</text>
                        <text x="440" y="520" class="encryption-text bit6" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">01</text>
                        <text x="640" y="620" class="encryption-text bit7" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">10</text>
                        <text x="840" y="400" class="encryption-text bit8" fill="var(--primary-color)" opacity="0.4" font-family="monospace" font-size="8">01</text>
                    {/if}
                </g>
            {/if}
        </g>
    </g>
    
    <!-- Bottom wave representing secure foundation -->
    <path d="M0,850 Q200,820 400,850 T800,850 T1200,820 V1000 H0 Z" fill="var(--primary-color)" opacity="0.05" class="security-wave wave1" />
    <path d="M0,880 Q300,850 600,880 T1200,850 V1000 H0 Z" fill="var(--primary-color)" opacity="0.08" class="security-wave wave2" />
    <path d="M0,910 Q400,880 800,910 T1200,880 V1000 H0 Z" fill="var(--secondary-color)" opacity="0.03" class="security-wave wave3" />
</svg>

<style>
    /* Path animations - customizable speed */
    .data-path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: drawPath calc(12s / var(--animation-speed)) infinite alternate ease-in-out;
        opacity: var(--opacity);
    }
    
    .path1 { animation-delay: 0s; }
    .path2 { animation-delay: 0.7s; }
    .path3 { animation-delay: 1.4s; }
    .path4 { animation-delay: 2.1s; }
    .path5 { animation-delay: 2.8s; }
    
    @keyframes drawPath {
        0% { stroke-dashoffset: 1000; }
        40% { stroke-dashoffset: 0; }
        60% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -1000; }
    }
    
    /* Router obfuscation animations */
    .router {
        stroke-dasharray: 500;
        stroke-dashoffset: 500;
        animation: routeTraffic calc(15s / var(--animation-speed)) infinite alternate ease-in-out;
        opacity: var(--opacity);
    }
    
    .router1 { animation-delay: 0.5s; }
    .router2 { animation-delay: 2.5s; }
    .router3 { animation-delay: 4.5s; }
    .router4 { animation-delay: 6.5s; }
    .router5 { animation-delay: 8.5s; }
    
    @keyframes routeTraffic {
        0% { stroke-dashoffset: 500; stroke-opacity: 0.05; }
        30% { stroke-dashoffset: 0; stroke-opacity: 0.15; }
        70% { stroke-dashoffset: 0; stroke-opacity: 0.15; }
        100% { stroke-dashoffset: -500; stroke-opacity: 0.05; }
    }
    
    /* Security node animations */
    .node {
        animation: secureNode calc(5s / var(--animation-speed)) infinite ease-in-out;
        opacity: var(--opacity);
    }
    
    .node1, .node5, .node9, .node13, .node17 { animation-delay: 0s; }
    .node2, .node6, .node10, .node14, .node18 { animation-delay: 1.25s; }
    .node3, .node7, .node11, .node15, .node19 { animation-delay: 2.5s; }
    .node4, .node8, .node12, .node16, .node20 { animation-delay: 3.75s; }
    
    @keyframes secureNode {
        0%, 100% { opacity: calc(0.7 * var(--opacity)); }
        50% { opacity: calc(1 * var(--opacity)); }
    }
    
    /* Data packet animations */
    .packet {
        animation: movePacket calc(20s / var(--animation-speed)) infinite linear;
        opacity: var(--opacity);
    }
    
    .p1 { animation-delay: 0s; }
    .p2 { animation-delay: 2.2s; }
    .p3 { animation-delay: 4.4s; }
    .p4 { animation-delay: 6.6s; }
    .p5 { animation-delay: 8.8s; }
    .p6 { animation-delay: 11s; }
    .p7 { animation-delay: 13.2s; }
    .p8 { animation-delay: 15.4s; }
    .p9 { animation-delay: 17.6s; }
    
    @keyframes movePacket {
        0% { transform: translateX(0); opacity: 0; }
        5% { opacity: calc(0.7 * var(--opacity)); }
        95% { opacity: calc(0.7 * var(--opacity)); }
        100% { transform: translateX(900px); opacity: 0; }
    }
    
    /* Encryption text animations */
    .encryption-text {
        animation: fadeInOut calc(8s / var(--animation-speed)) infinite ease-in-out;
        opacity: var(--opacity);
    }
    
    .bit1, .bit5 { animation-delay: 0s; }
    .bit2, .bit6 { animation-delay: 2s; }
    .bit3, .bit7 { animation-delay: 4s; }
    .bit4, .bit8 { animation-delay: 6s; }
    
    @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        50% { opacity: calc(0.4 * var(--opacity)); }
    }
    
    /* Security wave animations */
    .security-wave {
        animation: waveMotion calc(10s / var(--animation-speed)) infinite ease-in-out;
        opacity: var(--opacity);
    }
    
    .wave1 { animation-delay: 0s; }
    .wave2 { animation-delay: 2s; animation-direction: alternate-reverse; }
    .wave3 { animation-delay: 4s; }
    
    @keyframes waveMotion {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .data-path, .router {
            animation-duration: calc(18s / var(--animation-speed)); /* Slower animations on mobile */
        }
        
        .packet {
            animation-duration: calc(30s / var(--animation-speed));
        }
        
        .encryption-text {
            font-size: 6px;
        }
    }
</style>