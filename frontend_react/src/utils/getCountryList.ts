import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export const getCountryList = () => {

    const en = countries.getNames("en", { select: "official" });

    return Object.entries(en).map(([code, name]) => {

        if (code === "TW") name = "Taiwan";

        return {
            code,
            name,
        };
    });
};
