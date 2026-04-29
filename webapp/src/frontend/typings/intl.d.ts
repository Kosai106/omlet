// copied from https://github.com/microsoft/TypeScript/blob/e18c93511b5e8b02597b449f5fc84f9390b5c33f/src/lib/es2021.intl.d.ts
// TODO: remove after upgrade typescript to 4.7+
declare namespace Intl {
    /**
     * The locale matching algorithm to use.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#parameters).
     */
    type ListFormatLocaleMatcher = "lookup" | "best fit";

    /**
     * The format of output message.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#parameters).
     */
    type ListFormatType = "conjunction" | "disjunction" | "unit";

    /**
     * The length of the formatted message.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#parameters).
     */
    type ListFormatStyle = "long" | "short" | "narrow";

    /**
     * An object with some or all properties of the `Intl.ListFormat` constructor `options` parameter.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#parameters).
     */
    interface ListFormatOptions {
        /** The locale matching algorithm to use. For information about this option, see [Intl page](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation). */
        localeMatcher?: ListFormatLocaleMatcher | undefined;
        /** The format of output message. */
        type?: ListFormatType | undefined;
        /** The length of the internationalized message. */
        style?: ListFormatStyle | undefined;
    }

    interface ResolvedListFormatOptions {
        locale: string;
        style: ListFormatStyle;
        type: ListFormatType;
    }

    interface ListFormat {
        /**
         * Returns a string with a language-specific representation of the list.
         *
         * @param list - An iterable object, such as an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).
         *
         * @throws `TypeError` if `list` includes something other than the possible values.
         *
         * @returns {string} A language-specific formatted string representing the elements of the list.
         *
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/format).
         */
        format(list: Iterable<string>): string;

        /**
         * Returns an Array of objects representing the different components that can be used to format a list of values in a locale-aware fashion.
         *
         * @param list - An iterable object, such as an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), to be formatted according to a locale.
         *
         * @throws `TypeError` if `list` includes something other than the possible values.
         *
         * @returns {{ type: "element" | "literal", value: string; }[]} An Array of components which contains the formatted parts from the list.
         *
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/formatToParts).
         */
        formatToParts(list: Iterable<string>): { type: "element" | "literal"; value: string; }[];

        /**
         * Returns a new object with properties reflecting the locale and style
         * formatting options computed during the construction of the current
         * `Intl.ListFormat` object.
         *
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/resolvedOptions).
         */
        resolvedOptions(): ResolvedListFormatOptions;
    }

    const ListFormat: {
        prototype: ListFormat;

        /**
         * Creates [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) objects that
         * enable language-sensitive list formatting.
         *
         * @param locales - A string with a [BCP 47 language tag](http://tools.ietf.org/html/rfc5646), or an array of such strings.
         *  For the general form and interpretation of the `locales` argument,
         *  see the [`Intl` page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation).
         *
         * @param options - An [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#parameters)
         *  with some or all options of `ListFormatOptions`.
         *
         * @returns [Intl.ListFormatOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) object.
         *
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat).
         */
        new(locales?: string | string[], options?: ListFormatOptions): ListFormat;

        /**
         * Returns an array containing those of the provided locales that are
         * supported in list formatting without having to fall back to the runtime's default locale.
         *
         * @param locales - A string with a [BCP 47 language tag](http://tools.ietf.org/html/rfc5646), or an array of such strings.
         *  For the general form and interpretation of the `locales` argument,
         *  see the [`Intl` page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation).
         *
         * @param options - An [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/supportedLocalesOf#parameters).
         *  with some or all possible options.
         *
         * @returns An array of strings representing a subset of the given locale tags that are supported in list
         *  formatting without having to fall back to the runtime's default locale.
         *
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/supportedLocalesOf).
         */
        supportedLocalesOf(locales: string | string[], options?: Pick<ListFormatOptions, "localeMatcher">): string[];
    };

    interface NumberFormatPartTypeRegistry {
        literal: never;
        nan: never;
        infinity: never;
        percent: never;
        integer: never;
        group: never;
        decimal: never;
        fraction: never;
        plusSign: never;
        minusSign: never;
        percentSign: never;
        currency: never;
    }


    interface NumberFormatOptionsUseGroupingRegistry {
        min2: never;
        auto: never;
        always: never;
    }

    interface NumberFormatOptionsSignDisplayRegistry {
        negative: never;
    }

    interface NumberFormatOptions {
        roundingPriority?: "auto" | "morePrecision" | "lessPrecision" | undefined;
        roundingIncrement?: 1 | 2 | 5 | 10 | 20 | 25 | 50 | 100 | 200 | 250 | 500 | 1000 | 2000 | 2500 | 5000 | undefined;
        roundingMode?: "ceil" | "floor" | "expand" | "trunc" | "halfCeil" | "halfFloor" | "halfExpand" | "halfTrunc" | "halfEven" | undefined;
        trailingZeroDisplay?: "auto" | "stripIfInteger" | undefined;
    }

    interface ResolvedNumberFormatOptions {
        roundingPriority: "auto" | "morePrecision" | "lessPrecision";
        roundingMode: "ceil" | "floor" | "expand" | "trunc" | "halfCeil" | "halfFloor" | "halfExpand" | "halfTrunc" | "halfEven";
        roundingIncrement: 1 | 2 | 5 | 10 | 20 | 25 | 50 | 100 | 200 | 250 | 500 | 1000 | 2000 | 2500 | 5000;
        trailingZeroDisplay: "auto" | "stripIfInteger";
    }
    interface NumberFormatPart {
        // eslint-disable-next-line no-undef
        type: NumberFormatPartTypes;
        value: string;
    }

    interface NumberRangeFormatPart extends NumberFormatPart {
        source: "startRange" | "endRange" | "shared";
    }

    type StringNumericLiteral = `${number}` | "Infinity" | "-Infinity" | "+Infinity";

    interface NumberFormat {
        format(value: number | bigint | StringNumericLiteral): string;
        formatToParts(value: number | bigint | StringNumericLiteral): NumberFormatPart[];
        formatRange(start: number | bigint | StringNumericLiteral, end: number | bigint | StringNumericLiteral): string;
        formatRangeToParts(start: number | bigint | StringNumericLiteral, end: number | bigint | StringNumericLiteral): NumberRangeFormatPart[];
    }
}
