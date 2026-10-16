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
      <img
        src={selectedImage}
        style={{
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          border: "1px solid black",
          objectFit: "cover",
        }}
        alt="User profile image"
      />

      <button
        type="button"
        onClick={() => setIsPickerOpen((current) => !current)}
        style={{ width: "fit-content", padding: "8px 12px", cursor: "pointer" }}
      >
        Choose image
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

      <input
        type="text"
        value={selectedImage}
        readOnly
        aria-label="Selected profile image URL"
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
        }}
      />
    </div>
  );
};

export default ChooseProfileImage;
