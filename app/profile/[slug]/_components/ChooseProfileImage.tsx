"use client";

import { useMemo, useState } from "react";
import { avatarFiles } from "@/public/avatars/Images";
import { updateProfileImage } from "../_serverFunctions/profile";
const ChooseProfileImage = ({
  image,
  userId,
}: {
  image: string;
  userId: string;
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(image);

  const avatarUrls = useMemo(
    () => avatarFiles.map((avatar) => `/avatars/${avatar}`),
    [],
  );

  const onSelect = async (url: string) => {
    setSelectedImage(url);
    setIsPickerOpen(false);

    await updateProfileImage(url, userId);
  };

  return (
    <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
      <button
        type="button"
        onClick={() => setIsPickerOpen((current) => !current)}
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
        aria-label="Change profile image"
        style={{
          position: "relative",
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          border: "1px solid black",
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
          background: "transparent",
        }}
      >
        <img
          src={selectedImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "filter 180ms ease",
            filter: isHoveringImage ? "brightness(0.55)" : "brightness(1)",
          }}
          alt="User profile image"
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 600,
            opacity: isHoveringImage ? 1 : 0,
            transition: "opacity 180ms ease",
            pointerEvents: "none",
          }}
        >
          Edit
        </span>
      </button>

      {isPickerOpen ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(80px, 1fr))",
            gap: "8px",
            width: "100%",
          }}
        >
          {avatarUrls.map((avatarUrl) => (
            <button
              key={avatarUrl}
              type="button"
              onClick={() => onSelect(avatarUrl)}
              style={{
                border:
                  selectedImage === avatarUrl
                    ? "2px solid #2563eb"
                    : "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "4px",
                background: "white",
                cursor: "pointer",
              }}
              aria-label={`Select ${avatarUrl}`}
            >
              <img
                src={avatarUrl}
                alt={avatarUrl}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </button>
          ))}
        </div>
      ) : null}

    </div>
  );
};

export default ChooseProfileImage;
