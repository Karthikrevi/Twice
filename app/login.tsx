import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import axios from "axios";
import { useLogin } from "@/hooks/useAuth";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { useSession } from "@/store/session";

const AMBER = "#F5A623";
const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const URGENT = "#EF4444";
const SUCCESS = "#22C55E";

export default function Login() {
  const restaurantName = useSession((s) => s.restaurantName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const login = useLogin();
  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;
  const disabled = !valid || login.isPending;

  const submit = () => {
    login.reset();
    login.mutate({ email: email.trim(), password, keepLoggedIn });
  };

  const errorMessage = login.isError
    ? axios.isAxiosError(login.error) && login.error.response?.status === 401
      ? "Email or password is incorrect."
      : "We couldn't sign you in. Try again."
    : undefined;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}>
          {/* Wordmark */}
          <Text
            style={{
              color: AMBER,
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              letterSpacing: 10,
              textAlign: "center",
            }}
          >
            O N C E
          </Text>

          <View style={{ height: 32 }} />

          {/* Heading */}
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "Inter_700Bold",
              fontSize: 32,
              letterSpacing: -0.5,
            }}
          >
            Welcome back.
          </Text>
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              marginTop: 6,
            }}
          >
            {restaurantName ? `${restaurantName} · sign in to continue` : "Sign in to continue"}
          </Text>

          <View style={{ height: 24 }} />

          {/* Email */}
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_500Medium",
              fontSize: 11,
              letterSpacing: 1.6,
              marginBottom: 8,
            }}
          >
            EMAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@restaurant.ae"
            placeholderTextColor={TEXT_MUTED}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              height: 52,
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              paddingHorizontal: 16,
              color: TEXT_PRIMARY,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
            }}
          />

          <View style={{ height: 12 }} />

          {/* Password header row with Forgot password */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                letterSpacing: 1.6,
              }}
            >
              PASSWORD
            </Text>
            <TouchableOpacity onPress={() => setForgotOpen(true)} hitSlop={10}>
              <Text style={{ color: AMBER, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password input with eye icon */}
          <View style={{ position: "relative" }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                height: 52,
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 12,
                paddingLeft: 16,
                paddingRight: 48,
                color: TEXT_PRIMARY,
                fontFamily: "Inter_400Regular",
                fontSize: 15,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <Text
              style={{
                color: URGENT,
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                marginTop: 8,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}

          {/* Keep me logged in */}
          <TouchableOpacity
            onPress={() => setKeepLoggedIn((v) => !v)}
            activeOpacity={0.85}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                borderWidth: 1.5,
                borderColor: keepLoggedIn ? AMBER : BORDER,
                backgroundColor: SURFACE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {keepLoggedIn ? <Feather name="check" size={14} color={AMBER} /> : null}
            </View>
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                marginLeft: 10,
              }}
            >
              Keep me logged in
            </Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />

          {/* Sign in */}
          <TouchableOpacity
            onPress={submit}
            disabled={disabled}
            activeOpacity={0.85}
            style={{
              height: 52,
              backgroundColor: AMBER,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {login.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                Sign in
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />

          <Text
            style={{
              color: TEXT_MUTED,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Sessions expire after 15 minutes of inactivity.
          </Text>
        </View>

        {/* Absolute bottom helper */}
        <View style={{ paddingHorizontal: 28, paddingBottom: 12 }}>
          <Text
            style={{
              color: TEXT_MUTED,
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              textAlign: "center",
            }}
          >
            Trouble signing in? Contact your restaurant owner.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <ForgotPasswordSheet open={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </SafeAreaView>
  );
}

function ForgotPasswordSheet({
  open,
  onClose,
  initialEmail,
}: {
  open: boolean;
  onClose: () => void;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const forgot = useForgotPassword();
  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = () => {
    forgot.reset();
    forgot.mutate(email.trim());
  };

  const close = () => {
    forgot.reset();
    setEmail(initialEmail);
    onClose();
  };

  const errorMessage = forgot.isError
    ? "We couldn't send a reset link. Check your connection and try again."
    : undefined;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          backgroundColor: SURFACE,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER }} />
        </View>

        <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_700Bold", fontSize: 20 }}>
          Reset password
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginTop: 6,
            marginBottom: 18,
          }}
        >
          Enter your email and we'll send a reset link.
        </Text>

        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 11,
            letterSpacing: 1.6,
            marginBottom: 8,
          }}
        >
          EMAIL
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@restaurant.ae"
          placeholderTextColor={TEXT_MUTED}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!forgot.isSuccess}
          style={{
            height: 52,
            backgroundColor: BG,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 12,
            paddingHorizontal: 16,
            color: TEXT_PRIMARY,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
          }}
        />

        {forgot.isSuccess ? (
          <View
            style={{
              backgroundColor: SUCCESS + "1F",
              borderColor: SUCCESS + "55",
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginTop: 14,
            }}
          >
            <Text style={{ color: SUCCESS, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Check your email for a reset link.
            </Text>
          </View>
        ) : errorMessage ? (
          <Text
            style={{
              color: URGENT,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              marginTop: 10,
            }}
          >
            {errorMessage}
          </Text>
        ) : null}

        <View style={{ height: 18 }} />

        <TouchableOpacity
          onPress={submit}
          disabled={!valid || forgot.isPending || forgot.isSuccess}
          activeOpacity={0.85}
          style={{
            height: 52,
            backgroundColor: AMBER,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            opacity: !valid || forgot.isPending || forgot.isSuccess ? 0.5 : 1,
          }}
        >
          {forgot.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
              {forgot.isSuccess ? "Sent" : "Send reset link"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={close} activeOpacity={0.7} style={{ marginTop: 14, alignItems: "center" }}>
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Back to sign in
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
