import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "@/lib/api";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";
const URGENT = "#EF4444";

type Digits = [string, string, string, string];
const EMPTY: Digits = ["", "", "", ""];

export function usePinPrompt() {
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState<Digits>(EMPTY);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionRef = useRef<(() => void) | null>(null);
  const refs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const shake = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setPin(EMPTY);
    setError(null);
    setVerifying(false);
  }, []);

  const requirePin = useCallback(
    (action: () => void) => {
      actionRef.current = action;
      reset();
      setVisible(true);
      // focus first input on next tick
      setTimeout(() => refs.current[0]?.focus(), 60);
    },
    [reset]
  );

  const close = useCallback(() => {
    setVisible(false);
    actionRef.current = null;
    reset();
  }, [reset]);

  const runShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const submit = async (pinStr: string) => {
    setVerifying(true);
    setError(null);
    try {
      await api.post("/auth/verify-pin", { pin: pinStr });
      const action = actionRef.current;
      actionRef.current = null;
      setVisible(false);
      reset();
      action?.();
    } catch {
      setError("Incorrect PIN");
      runShake();
      setPin(EMPTY);
      setTimeout(() => refs.current[0]?.focus(), 30);
    } finally {
      setVerifying(false);
    }
  };

  const onDigit = (i: number, value: string) => {
    const ch = value.replace(/\D/g, "").slice(-1);
    setPin((prev) => {
      const next = [...prev] as Digits;
      next[i] = ch;
      if (ch && i < 3) {
        setTimeout(() => refs.current[i + 1]?.focus(), 0);
      }
      if (next.every((c) => c.length === 1)) {
        const pinStr = next.join("");
        setTimeout(() => submit(pinStr), 80);
      }
      return next;
    });
    setError(null);
  };

  const onKeyPress = (i: number, key: string) => {
    if (key === "Backspace" && !pin[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  function PinPromptModal() {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <Pressable
            onPress={() => {
              /* swallow */
            }}
            style={{
              width: "100%",
              maxWidth: 420,
            }}
          >
            <Animated.View
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 24,
                transform: [{ translateX: shake }],
              }}
            >
              <Text
                style={{
                  color: TEXT_PRIMARY,
                  fontFamily: "Inter_700Bold",
                  fontSize: 20,
                  letterSpacing: -0.3,
                }}
              >
                Owner PIN Required
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  marginTop: 6,
                  marginBottom: 20,
                }}
              >
                Enter the 4-digit owner PIN to continue.
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    value={pin[i]}
                    onChangeText={(v) => onDigit(i, v)}
                    onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
                    editable={!verifying}
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry
                    selectTextOnFocus
                    style={{
                      flex: 1,
                      height: 60,
                      backgroundColor: BG,
                      borderWidth: 1,
                      borderColor: error ? URGENT : BORDER,
                      borderRadius: 12,
                      textAlign: "center",
                      color: AMBER,
                      fontFamily: "Inter_700Bold",
                      fontSize: 24,
                    }}
                  />
                ))}
              </View>

              {error ? (
                <Text
                  style={{
                    color: URGENT,
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    marginTop: 14,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={close}
                activeOpacity={0.7}
                style={{ marginTop: 20, alignItems: "center" }}
              >
                <Text
                  style={{
                    color: TEXT_SECONDARY,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return { requirePin, PinPromptModal };
}
