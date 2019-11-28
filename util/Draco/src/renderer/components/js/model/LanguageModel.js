export class LanguageModel {
    eLanguage = {
        default: "default",
        en: "en",
    }

    curLanguage;

    languageTableName = "Language.csv";

    languageList = [
        {
            name: this.eLanguage.default, csvPath: "/settings/config/csv", UITextPath: "/settings/UItext/UIText_zh"
        },
        {
            name: this.eLanguage.en, csvPath: "/settings/config/csv_en", UITextPath: "/settings/UItext/UItext_en"
        }
    ];

    init() {
        this.curLanguage = this.languageList.find(value => value.name === this.eLanguage.default);
    }
}