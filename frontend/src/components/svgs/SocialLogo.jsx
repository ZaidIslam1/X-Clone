const SocialLogo = (props) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
        {/* Custom "Z" Logo with gradient effect */}
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(139, 69, 255)" />
                <stop offset="100%" stopColor="rgb(255, 119, 45)" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        {/* Bold, clean "Z" design */}
        <g filter="url(#glow)">
            {/* Top horizontal bar - solid fallback with gradient overlay */}
            {/* Solid fallback so the bar is visible when gradients are blocked */}
            <rect x="4" y="4" width="16" height="3" rx="1.5" fill="#8b45ff" />
            {/* Gradient overlay (renders on browsers that honor the SVG gradient) */}
            <rect
                x="4"
                y="4"
                width="16"
                height="3"
                rx="1.5"
                fill="url(#logoGradient)"
                style={{ fill: "url(#logoGradient)" }}
            />
            {/* Diagonal bar - fallback darker purple */}
            <polygon points="17,7 20,7 7,17 4,17" fill="#6f2bd6" />
            {/* Bottom horizontal bar - fallback orange */}
            <rect x="4" y="17" width="16" height="3" rx="1.5" fill="#ff7730" />
        </g>
        {/* Accent dot */}
        <circle cx="19" cy="5.5" r="1.5" fill="rgb(255, 215, 0)" opacity="0.9" />
    </svg>
);

export default SocialLogo;
