// mobile/src/components/BowlPicker.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { C, fmt } from "../theme";
import { BOWL_SIZES } from "../data";

export default function BowlPicker({ visible, itemName, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={st.handle} />
          <Text style={st.title}>Choose Bowl Size</Text>
          {itemName && <Text style={st.subtitle}>{itemName}</Text>}

          {BOWL_SIZES.map((size) => (
            <TouchableOpacity
              key={size.id}
              style={st.option}
              onPress={() => onSelect(size)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={st.optLabel}>{size.label}</Text>
                <Text style={st.optDesc}>{size.desc}</Text>
              </View>
              <Text style={st.optMult}>×{size.multiplier}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={st.cancelBtn} onPress={onClose}>
            <Text style={st.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { color: C.cream, fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { color: C.textDim, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: C.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  optLabel: { color: C.cream, fontSize: 14, fontWeight: "600" },
  optDesc: { color: C.textDim, fontSize: 11, marginTop: 2 },
  optMult: { color: C.burg, fontSize: 16, fontWeight: "700", marginLeft: 12 },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: C.textDim, fontSize: 14, fontWeight: "600" },
});
