import {
    normalize,
    extractBracketPhrases,
    isSerialPattern,
    STOP_WORDS,
    REGEX_SKIP_PATTERNS,
    ZH_STOP_WORDS,
    EN_STOP_WORDS,
    SERIAL_PREFIXES,
} from './textUtils';

// ===== normalize =====

describe('normalize', () => {
    it('應在中文與英文之間插入空格', () => {
        expect(normalize('你好World')).toBe('你好 world');
        expect(normalize('中文abc中文')).toBe('中文 abc 中文');
        expect(normalize('Hello世界')).toBe('hello 世界');
    });

    it('應將各種括號替換為空格', () => {
        // normalize 不做 trim，括號在邊緣會留下前後空格
        expect(normalize('[test]')).toBe(' test ');
        expect(normalize('【測試】(abc)')).toBe(' 測試 abc ');
        expect(normalize('（前）後')).toBe(' 前 後');
    });

    it('應移除特殊符號但保留底線', () => {
        expect(normalize('a_b')).toBe('a_b');
        expect(normalize('a!@#b')).toBe('a b');
    });

    it('應轉為小寫', () => {
        expect(normalize('ABC')).toBe('abc');
        expect(normalize('Hello WORLD')).toBe('hello world');
    });

    it('preserveDot 為 true 時應保留點號', () => {
        expect(normalize('v1.0.2', { preserveDot: true })).toBe('v1.0.2');
    });

    it('preserveDot 預設不保留點號', () => {
        expect(normalize('v1.0.2')).toBe('v1 0 2');
    });

    it('應正確處理複雜混合文字', () => {
        expect(normalize('【中文】abc_DEF(123)')).toBe(' 中文 abc_def 123 ');
    });

    it('空字串應回傳空字串', () => {
        expect(normalize('')).toBe('');
    });

    it('純空白字元應回傳空白', () => {
        // 特殊符號被移除後只剩空格
        expect(normalize('   ').trim()).toBe('');
    });
});

// ===== extractBracketPhrases =====

describe('extractBracketPhrases', () => {
    it('應從四種括號中擷取內容', () => {
        const result = extractBracketPhrases('a[test1]b(test2)c【test3】d（test4）');
        expect(result).toEqual(['test1', 'test2', 'test3', 'test4']);
    });

    it('應排除僅包含單個中文字的括號', () => {
        const result = extractBracketPhrases('【中】[abc]');
        expect(result).toEqual(['abc']);
    });

    it('應對擷取內容進行 normalize（小寫化）', () => {
        const result = extractBracketPhrases('[ABC DEF]');
        expect(result).toEqual(['abc def']);
    });

    it('空字串應回傳空陣列', () => {
        expect(extractBracketPhrases('')).toEqual([]);
    });

    it('無括號時應回傳空陣列', () => {
        expect(extractBracketPhrases('no brackets here')).toEqual([]);
    });

    it('應過濾掉 normalize 後為空的結果', () => {
        // 括號內只有特殊字元，normalize 後 trim 為空
        expect(extractBracketPhrases('[!!!]')).toEqual([]);
    });

    it('應處理巢狀括號的外層', () => {
        // 正則是非貪婪匹配，會匹配最小範圍
        const result = extractBracketPhrases('[outer[inner]');
        expect(result.length).toBeGreaterThanOrEqual(1);
    });
});

// ===== isSerialPattern =====

describe('isSerialPattern', () => {
    describe('純數字', () => {
        it('應判定純數字為流水號', () => {
            expect(isSerialPattern('123')).toBe(true);
            expect(isSerialPattern('0')).toBe(true);
            expect(isSerialPattern('9999')).toBe(true);
        });
    });

    describe('中文數字', () => {
        it('應判定純中文數字為流水號', () => {
            expect(isSerialPattern('一二三')).toBe(true);
            expect(isSerialPattern('十')).toBe(true);
            expect(isSerialPattern('百萬')).toBe(true);
        });
    });

    describe('羅馬數字', () => {
        it('應判定羅馬數字為流水號（不分大小寫）', () => {
            expect(isSerialPattern('III')).toBe(true);
            expect(isSerialPattern('iv')).toBe(true);
            expect(isSerialPattern('XV')).toBe(true);
        });
    });

    describe('帶 # 的數字', () => {
        it('應判定 #123 格式為流水號', () => {
            expect(isSerialPattern('#1')).toBe(true);
            expect(isSerialPattern('#1234')).toBe(true);
        });

        it('不應判定超過四位數的 # 格式', () => {
            expect(isSerialPattern('#12345')).toBe(false);
        });
    });

    describe('劇集格式', () => {
        it('應判定 S01E03 為流水號', () => {
            expect(isSerialPattern('s01e03')).toBe(true);
            expect(isSerialPattern('S2E5')).toBe(true);
        });
    });

    describe('日期格式', () => {
        it('應判定 YYYY.MM.DD 格式為流水號', () => {
            expect(isSerialPattern('2024.01.15')).toBe(true);
            expect(isSerialPattern('2024.1.5')).toBe(true);
        });
    });

    describe('中文時間格式', () => {
        it('應判定「第X年/季/周」格式', () => {
            expect(isSerialPattern('第三季')).toBe(true);
            expect(isSerialPattern('第1個月')).toBe(true);
        });
    });

    describe('中文章節格式', () => {
        it('應判定「第X章/集/部」格式', () => {
            expect(isSerialPattern('第五章')).toBe(true);
            expect(isSerialPattern('第12集')).toBe(true);
        });

        it('應判定「X章/集/部」格式（無「第」）', () => {
            expect(isSerialPattern('六部')).toBe(true);
            expect(isSerialPattern('12篇')).toBe(true);
        });

        it('應判定「上/下/前/中/後 + 集/篇」格式', () => {
            expect(isSerialPattern('上集')).toBe(true);
            expect(isSerialPattern('後篇')).toBe(true);
            expect(isSerialPattern('中章')).toBe(true);
        });
    });

    describe('周目格式', () => {
        it('應判定「X周目/週目」格式', () => {
            expect(isSerialPattern('一周目')).toBe(true);
            expect(isSerialPattern('2週目')).toBe(true);
            expect(isSerialPattern('第二周目')).toBe(true);
        });
    });

    describe('前綴 + 數字', () => {
        it('應判定 ep12, vol003, part1 等為流水號', () => {
            expect(isSerialPattern('ep12')).toBe(true);
            expect(isSerialPattern('vol003')).toBe(true);
            expect(isSerialPattern('ch1')).toBe(true);
            expect(isSerialPattern('part5')).toBe(true);
        });

        it('不應判定未知前綴 + 數字', () => {
            expect(isSerialPattern('abc123')).toBe(false);
        });
    });

    describe('括號包覆的流水號', () => {
        it('應判定全形括號包覆的前綴 + 數字', () => {
            // 括號內前綴+數字走 prefixMatch 分支
            expect(isSerialPattern('【ep12】')).toBe(true);
            expect(isSerialPattern('（ep5）')).toBe(true);
        });

        it('半形括號包覆的前綴 + 數字', () => {
            expect(isSerialPattern('(ep12)')).toBe(true);
            expect(isSerialPattern('[ch3]')).toBe(true);
        });
    });

    describe('非流水號', () => {
        it('不應判定一般文字為流水號', () => {
            expect(isSerialPattern('hello')).toBe(false);
            expect(isSerialPattern('minecraft')).toBe(false);
            expect(isSerialPattern('遊戲')).toBe(false);
        });
    });
});

// ===== STOP_WORDS =====

describe('STOP_WORDS', () => {
    it('應為 Set 型別', () => {
        expect(STOP_WORDS).toBeInstanceOf(Set);
    });

    it('應包含英文停用詞', () => {
        expect(STOP_WORDS.has('the')).toBe(true);
        expect(STOP_WORDS.has('and')).toBe(true);
    });

    it('應包含中文停用詞', () => {
        expect(STOP_WORDS.has('遊戲')).toBe(true);
        expect(STOP_WORDS.has('更新')).toBe(true);
    });

    it('應包含流水號前綴', () => {
        expect(STOP_WORDS.has('ep')).toBe(true);
        expect(STOP_WORDS.has('vol')).toBe(true);
    });

    it('總數應等於三個清單合併後的不重複項目數', () => {
        const combined = new Set([...EN_STOP_WORDS, ...ZH_STOP_WORDS, ...SERIAL_PREFIXES]);
        expect(STOP_WORDS.size).toBe(combined.size);
    });
});

// ===== REGEX_SKIP_PATTERNS =====

describe('REGEX_SKIP_PATTERNS', () => {
    it('應為非空正則陣列', () => {
        expect(REGEX_SKIP_PATTERNS.length).toBeGreaterThan(0);
        REGEX_SKIP_PATTERNS.forEach((p) => {
            expect(p).toBeInstanceOf(RegExp);
        });
    });
});
