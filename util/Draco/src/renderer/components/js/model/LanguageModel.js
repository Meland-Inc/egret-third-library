export class LanguageModel {
    eLanguage = {
        default: "default",
        en: "en",
    }

    curLanguage;

    languageTableName = "Language.csv";

    languageList = [
        {
            name: this.eLanguage.default, csvPath: "/versionRes/trunk/settings/config/csv", UITextPath: "/versionRes/trunk/settings/UItext/UIText_zh"
        },
        {
            name: this.eLanguage.en, csvPath: "/versionRes/trunk/settings/config/csv_en", UITextPath: "/versionRes/trunk/settings/UItext/UItext_en"
        }
    ];

    init() {
        this.curLanguage = this.languageList.find(value => value.name === this.eLanguage.default);
    }
}