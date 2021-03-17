import React, { ReactElement, useEffect, useRef } from "react";
import { ScrollView, Image, View, ViewProps, ViewStyle } from "react-native";
import { useAppOptions, languages, useNavigation } from "../hook";
import logo from "../assets/logo.svg";
import { Text, Button, ButtonGroup, ButtonProps, ButtonGroupProps, withAttrs, Separator, activateAutoFocus, isTouchDevice } from "./index";
import Select from "react-select";

const customLanguageSelectStyles = {
  option: (provided, { data, isDisabled, isFocused, isSelected }) => ({
    ...provided,
    background: isSelected ? 'rgba(42, 68, 236, 0.08)' : isFocused ? 'rgba(143, 155, 179, 0.16)':'rgb(255, 255, 255)',
    ':active': {
      ...provided[':active'],
      backgroundColor:
        !isDisabled && (isSelected ? 'rgba(42, 68, 236, 0.08)' : null),
    },
    color: 'color: rgb(34, 43, 69)',
  }),
  input: (provided, state) => ({
    ...provided,
  }),
  menu: (provided, state) => ({
    ...provided,
    fontSize: '12px',
    padding: '2px',
  }),
  menuList: (provided, state) => ({
    ...provided,
    width: 'auto',
    paddingTop: '0px',
    paddingBottom: '0px',
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    backgroundColor: 'rgb(255, 255, 255)'
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
  }),
  control: (provided, state) => ({
    ...provided,
    height: '24px',
    width: '69px',
    borderColor: 'rgb(255, 255, 255)',
    borderWdith: '0',
    boxShadow: 'none',
    fontSize: '12px',
    padding: '2px',
    color: 'rgb(143, 155, 179)',
    ':hover': {
      ...provided[':hover'],
      borderColor: 'rgb(204, 204, 204)',
    },
  }),
}

type LayoutFooterButtonGroupProps = {
  hidden?: boolean;
  loading?: boolean;
  group: LayoutFooterButtonProps[];
} & Omit<ButtonGroupProps, "children">;

type LayoutFooterButtonProps = {
  tabIndex?: number
  hidden?: boolean;
  loading?: boolean;
} & ButtonProps;

type LayoutFooterSeparatorProps = {
  separator: string | true;
  hidden?: boolean;
}

/*
<View
  style={{
    top: 0, right: 0, zIndex: 1000, alignItems: "flex-end", flex: 0,
    ...({
      position: "sticky",
      transition: "opacity 1s",
      opacity: loading ? 0.3 : 0,
    } as unknown as ViewStyle)
  }}>
  <View style={{margin: 20}}>
    <Spinner size={"tiny"} status={"primary"} />
  </View>
</View>
*/

// ref: ../../app/theme.css
const setScrollContainerRole = withAttrs({"data-role": "scroll-container"});

export const ScreenLayout: React.FunctionComponent<{
  title?: string | ReactElement,
  subtitle?: string | ReactElement,
  loading?: boolean;
  buttons?: (LayoutFooterButtonProps | LayoutFooterSeparatorProps | LayoutFooterButtonGroupProps)[],
  footer?: ReactElement,
  error?: string,
  containerStyle?: ViewStyle,
}> = ({title = "undefined", subtitle = null, loading = false, children = null, buttons = [], error = null, footer = null, containerStyle = {} }) => {
  const { nav } = useNavigation();
  const scrollableRef = useRef<ScrollView|null>(null);
  useEffect(() => {
    if (isTouchDevice) return;
    return nav.addListener("focus", () => {
      if (scrollableRef.current) {
        const node = scrollableRef.current.getInnerViewNode();
        setTimeout(() => {
          activateAutoFocus(node);
        }, 300); // delay for transition animation
      }
    });
  }, [nav]);

  const [options] = useAppOptions();
  return (
    <ScrollView
      ref={ref => {
        scrollableRef.current = ref;
        if (ref) {
          setScrollContainerRole(ref);
        }
      }}
      style={{width: "100%"}}
      contentContainerStyle={{width: "100%", marginVertical: "auto", padding: 30, ...containerStyle}}
    >
      <View style={{alignItems: options.logo.align, marginBottom: 20}}>
        <Image source={{uri: options.logo.uri || logo}} style={{height: options.logo.height, width: options.logo.width, resizeMode: "contain"}}/>
      </View>

      <View style={{marginBottom: 30}}>
        <Text category={"h5"}>{title}</Text>
        {subtitle && <Text category={"s2"} style={{marginTop: 5}}>{subtitle}</Text>}
      </View>

      {children ? <View style={{marginBottom: 30}}>{children}</View> : null}

      {error ? <Text status={"danger"} category={"c2"} style={{marginBottom: 15}}>{error}</Text> : null}

      {buttons.length > 0 ? (
        buttons.map((args, index) => {
          if (args.hidden === true) {
            return null;
          }

          // render separator
          const s = args as LayoutFooterSeparatorProps;
          if (s.separator) {
            return (
              <Separator
                key={index}
                text={typeof s.separator === "string" ? s.separator : undefined}
              />
            );
          }

          // render button groups
          const g = args as LayoutFooterButtonGroupProps;
          if (g.group) {
            // tslint:disable-next-line:no-shadowed-variable
            const {group, loading, ...groupProps} = g;
            return (
              <View
                key={index}
                style={{marginBottom: 15}}
              >
                <ButtonGroup
                  // default
                  status={"basic"}
                  size={"large"}
                  appearance={"filled"}

                  // custom
                  {...groupProps}
                >
                  {g.group.map((btn, key) => {
                    // tslint:disable-next-line:no-shadowed-variable
                    const {hidden, tabIndex, loading, ...props} = btn;
                    return (
                      <Button
                        ref={withAttrs({tabindex: tabIndex || null})}
                        key={key}

                        // default
                        status={"basic"}
                        size={"large"}
                        style={{flexGrow: 1, flexShrink: 1, flexBasis: `${Math.ceil(100/g.group.length)}%`}}

                        // custom
                        {...props}

                        // override
                        children={evaProps => <Text {...evaProps} style={[evaProps?.style, {textAlign: "center"}]} children={props.children as any}/>}
                        appearance={(g.loading || btn.loading) ? "outline" : (props.appearance || "filled")}
                        onPress={loading ? undefined : props.onPress}
                        onPressOut={loading ? undefined : props.onPressOut}
                        onPressIn={loading ? undefined : props.onPressIn}
                        onLongPress={loading ? undefined : props.onLongPress}
                      />
                    );
                  })}
                </ButtonGroup>
              </View>
            );
          }

          // render button
          // tslint:disable-next-line:no-shadowed-variable
          const {hidden, tabIndex, loading, children, ...props} = args as LayoutFooterButtonProps;
          return (
            <View
              key={index}
              style={{marginBottom: 15}}
            >
              <Button
                ref={withAttrs({tabindex: tabIndex || null})}

                // default
                status={"basic"}
                size={"large"}

                // custom
                {...props}

                // override
                appearance={loading ? "outline" : (props.appearance || "filled")}
                onPress={loading ? undefined : props.onPress}
                onPressOut={loading ? undefined : props.onPressOut}
                onPressIn={loading ? undefined : props.onPressIn}
                onLongPress={loading ? undefined : props.onLongPress}
              >
                {(evaProps = {}) => <Text {...evaProps} style={[evaProps.style, (props as any).textStyle]}>{ children as any }</Text>}
              </Button>
            </View>
          );
        })
      ) : null}

      {footer}

      <LanguageSelector style={{marginTop: 5}} />
    </ScrollView>
  );
};

const LanguageSelector: React.FunctionComponent<ViewProps> = ({ style }) => {
  const [options, setOptions] = useAppOptions();
  const languageSelectorData = Object.keys(languages).map(code => {
    return {
      title: languages[code],
      label: code,
      value: code,
    };
  });
  const selectedItem = languageSelectorData.find(d => d.value === options.locale.language);

  return (
    <View style={style}>
      <View style={{flexDirection: "row"}}>
        <View style={{flexGrow: 1}}/>
        <Select
          onChange={(v) =>setOptions(o => ({...o, locale: { ...o.locale, language: v.value}}))}
          isSearchable={false}
          width={'69px'}
          defaultValue={selectedItem}
          size={2}
          styles={customLanguageSelectStyles}
          options={languageSelectorData}
          menuPlacement={'top'}
      />
      </View>
    </View>
  );
}
