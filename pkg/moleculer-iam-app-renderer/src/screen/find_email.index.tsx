import React, { useState } from "react";
import { useAppState, useWithLoading, useNavigation, useAppOptions, useI18N } from "../hook";
import { ScreenLayout, Text, FormInput } from "./component";

export const FindEmailIndexScreen: React.FunctionComponent = () => {
  const { nav } = useNavigation();
  const [state, dispatch] = useAppState();
  const [options] = useAppOptions();
  const [phoneNumber, setPhoneNumber] = useState("");
  const { formatMessage: f } = useI18N();

  // handlers
  const { loading, errors, setErrors, withLoading } = useWithLoading();
  const [handleCheckPhoneNumber, handleCheckPhoneNumberLoading] = withLoading(() => {
    dispatch("verify_phone.check_phone", {
      phone_number: `${options.locale.country}|${phoneNumber}`,
      registered: true,
    }, {
      phone_number: f({id: "payload.phoneNumber"}),
    })
      .then((s) => {
        setErrors({});
        setPhoneNumber(s.session.verifyPhone.phoneNumber);
        nav.navigate("verify_phone.stack", {
          screen: "verify_phone.verify",
          params: {
            callback: "find_email",
          },
        });
      })
      .catch((err: any) => setErrors(err))
  }, [phoneNumber, options]);

  const [handleCancel, handleCancelLoading] = withLoading(() => {
    nav.navigate("login.stack", {
      screen: "login.index",
      params: {},
    });
    setErrors({});
  });

  // render
  return (
    <ScreenLayout
      title={f({id: "findEmail.findYourAccount"})}
      subtitle={f({id: "findEmail.byPhone"})}
      loading={loading}
      buttons={[
        {
          status: "primary",
          children: f({id: "button.continue"}),
          onPress: handleCheckPhoneNumber,
          loading: handleCheckPhoneNumberLoading,
          tabIndex: 22,
        },
        {
          children: f({id: "button.cancel"}),
          onPress: handleCancel,
          loading: handleCancelLoading,
          tabIndex: 23,
          hidden: !state.routes.login,
        },
      ]}
      error={errors.global}
    >
      <Text style={{marginBottom: 30}}>
        {f({id: "findEmail.haveRegisteredPhoneNumber"})}
      </Text>
      <FormInput
        autoFocus
        tabIndex={21}
        label={f({id: "payload.phoneNumber"})}
        placeholder={f({ id: "placeholder.phoneNumber" }, { country: options.locale.country })}
        blurOnSubmit={false}
        keyboardType={"phone-pad"}
        autoCompleteType={"tel"}
        value={phoneNumber}
        error={errors.phone_number}
        setValue={setPhoneNumber}
        onEnter={handleCheckPhoneNumber}
      />
    </ScreenLayout>
  );
};
