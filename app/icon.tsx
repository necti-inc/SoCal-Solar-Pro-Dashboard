import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 512, height: 512 }
export const contentType = "image/png"

function BrandMark({ canvasSize }: { canvasSize: number }) {
    const iconSize = Math.round(canvasSize * 0.56)

    return (
        <div
            style={{
                width: canvasSize,
                height: canvasSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #068DD4 0%, #0EA5E9 100%)",
                borderRadius: Math.round(canvasSize * 0.22),
            }}
        >
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
                <path
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                />
            </svg>
        </div>
    )
}

export default function Icon() {
    return new ImageResponse(<BrandMark canvasSize={512} />, {
        width: 512,
        height: 512,
    })
}
