from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. 農曆資料庫 (請確保這裡是完整的 1900-2030 資料!)
# ==========================================
# ⚠️⚠️⚠️ 請在此處貼上您原本完整的 LUNAR_DB 字典 ⚠️⚠️⚠️
LUNAR_DB = {
    1900: { 'new_year': '1900-01-31', 'code': '08|1100101101101' },
    1901: { 'new_year': '1901-02-19', 'code': '00|0100101011100' },
    1902: { 'new_year': '1902-02-08', 'code': '00|1010010101110' },
    1903: { 'new_year': '1903-01-29', 'code': '05|0101001001101' },
    1904: { 'new_year': '1904-02-16', 'code': '00|1101001001100' },
    1905: { 'new_year': '1905-02-04', 'code': '00|1101100101010' },
    1906: { 'new_year': '1906-01-25', 'code': '04|0110101010101' },
    1907: { 'new_year': '1907-02-13', 'code': '00|0101011010100' },
    1908: { 'new_year': '1908-02-02', 'code': '00|1001101011010' },
    1909: { 'new_year': '1909-01-22', 'code': '02|0100101011101' },
    1910: { 'new_year': '1910-02-10', 'code': '00|0100101011100' },
    1911: { 'new_year': '1911-01-30', 'code': '06|1010010011011' },
    1912: { 'new_year': '1912-02-18', 'code': '00|1010010011010' },
    1913: { 'new_year': '1913-02-06', 'code': '00|1101001001010' },
    1914: { 'new_year': '1914-01-26', 'code': '05|1101010100101' },
    1915: { 'new_year': '1915-02-14', 'code': '00|1011010101000' },
    1916: { 'new_year': '1916-02-03', 'code': '00|1101011010100' },
    1917: { 'new_year': '1917-01-23', 'code': '02|1001011011010' },
    1918: { 'new_year': '1918-02-11', 'code': '00|1001010110110' },
    1919: { 'new_year': '1919-02-01', 'code': '07|0100100110111' },
    1920: { 'new_year': '1920-02-20', 'code': '00|0100100101110' },
    1921: { 'new_year': '1921-02-08', 'code': '00|1010010010110' },
    1922: { 'new_year': '1922-01-28', 'code': '05|1011001001011' },
    1923: { 'new_year': '1923-02-16', 'code': '00|0110101001010' },
    1924: { 'new_year': '1924-02-05', 'code': '00|0110110101000' },
    1925: { 'new_year': '1925-01-24', 'code': '04|1010110110101' },
    1926: { 'new_year': '1926-02-13', 'code': '00|0010101101100' },
    1927: { 'new_year': '1927-02-02', 'code': '00|1001010101110' },
    1928: { 'new_year': '1928-01-23', 'code': '02|0100100101111' },
    1929: { 'new_year': '1929-02-10', 'code': '00|0100100101110' },
    1930: { 'new_year': '1930-01-30', 'code': '06|0110010010110' },
    1931: { 'new_year': '1931-02-17', 'code': '00|1101010010100' },
    1932: { 'new_year': '1932-02-06', 'code': '00|1110101001010' },
    1933: { 'new_year': '1933-01-26', 'code': '05|0110110101001' },
    1934: { 'new_year': '1934-02-14', 'code': '00|0101101011010' },
    1935: { 'new_year': '1935-02-04', 'code': '00|0010101101100' },
    1936: { 'new_year': '1936-01-24', 'code': '03|1001001101110' },
    1937: { 'new_year': '1937-02-11', 'code': '00|1001001011100' },
    1938: { 'new_year': '1938-01-31', 'code': '07|1100100101101' },
    1939: { 'new_year': '1939-02-19', 'code': '00|1100100101010' },
    1940: { 'new_year': '1940-02-08', 'code': '00|1101010010100' },
    1941: { 'new_year': '1941-01-27', 'code': '06|1101101001010' },
    1942: { 'new_year': '1942-02-15', 'code': '00|1011010101010' },
    1943: { 'new_year': '1943-02-05', 'code': '00|0101011010100' },
    1944: { 'new_year': '1944-01-25', 'code': '04|1010101011011' },
    1945: { 'new_year': '1945-02-13', 'code': '00|0010010111010' },
    1946: { 'new_year': '1946-02-02', 'code': '00|1001001011010' },
    1947: { 'new_year': '1947-01-22', 'code': '02|1100100101011' },
    1948: { 'new_year': '1948-02-10', 'code': '00|1010100101010' },
    1949: { 'new_year': '1949-01-29', 'code': '07|1011010010101' },
    1950: { 'new_year': '1950-02-17', 'code': '00|0110110010100' },
    1951: { 'new_year': '1951-02-06', 'code': '00|1011010101010' },
    1952: { 'new_year': '1952-01-27', 'code': '05|0101010110101' },
    1953: { 'new_year': '1953-02-14', 'code': '00|0100110110100' },
    1954: { 'new_year': '1954-02-03', 'code': '00|1010010110110' },
    1955: { 'new_year': '1955-01-24', 'code': '03|0101001010111' },
    1956: { 'new_year': '1956-02-12', 'code': '00|0101001010110' },
    1957: { 'new_year': '1957-01-31', 'code': '08|1010100101010' },
    1958: { 'new_year': '1958-02-18', 'code': '00|1110100101010' },
    1959: { 'new_year': '1959-02-08', 'code': '00|0110101010100' },
    1960: { 'new_year': '1960-01-28', 'code': '06|1010110101010' },
    1961: { 'new_year': '1961-02-15', 'code': '00|1010101101010' },
    1962: { 'new_year': '1962-02-05', 'code': '00|0100101101100' },
    1963: { 'new_year': '1963-01-25', 'code': '04|1010010101110' },
    1964: { 'new_year': '1964-02-13', 'code': '00|1010010101110' },
    1965: { 'new_year': '1965-02-02', 'code': '00|0101001001100' },
    1966: { 'new_year': '1966-01-21', 'code': '03|1110100100110' },
    1967: { 'new_year': '1967-02-09', 'code': '00|1101100101010' },
    1968: { 'new_year': '1968-01-30', 'code': '07|0101101010101' },
    1969: { 'new_year': '1969-02-17', 'code': '00|0101011010100' },
    1970: { 'new_year': '1970-02-06', 'code': '00|1011101001010' },
    1971: { 'new_year': '1971-01-27', 'code': '05|0100101011101' },
    1972: { 'new_year': '1972-02-15', 'code': '00|0100101011010' },
    1973: { 'new_year': '1973-02-03', 'code': '00|1010010011010' },
    1974: { 'new_year': '1974-01-23', 'code': '04|1101001001101' },
    1975: { 'new_year': '1975-02-11', 'code': '00|1101001001010' },
    1976: { 'new_year': '1976-01-31', 'code': '08|1101010100101' },
    1977: { 'new_year': '1977-02-18', 'code': '00|1011010101000' },
    1978: { 'new_year': '1978-02-07', 'code': '00|1011011010100' },
    1979: { 'new_year': '1979-01-28', 'code': '06|1001011011010' },
    1980: { 'new_year': '1980-02-16', 'code': '00|1001010110110' },
    1981: { 'new_year': '1981-02-05', 'code': '00|0100100110110' },
    1982: { 'new_year': '1982-01-25', 'code': '04|1010010010111' },
    1983: { 'new_year': '1983-02-13', 'code': '00|1010010010110' },
    1984: { 'new_year': '1984-02-02', 'code': '10|1011001001011' },
    1985: { 'new_year': '1985-02-20', 'code': '00|0110101001010' },
    1986: { 'new_year': '1986-02-09', 'code': '00|0110110101000' },
    1987: { 'new_year': '1987-01-29', 'code': '06|1010110110100' },
    1988: { 'new_year': '1988-02-17', 'code': '00|1010101101100' },
    1989: { 'new_year': '1989-02-06', 'code': '00|1001010101110' },
    1990: { 'new_year': '1990-01-27', 'code': '05|0100100101111' },
    1991: { 'new_year': '1991-02-15', 'code': '00|0100100101110' },
    1992: { 'new_year': '1992-02-04', 'code': '00|0110010010110' },
    1993: { 'new_year': '1993-01-23', 'code': '03|0110101001010' },
    1994: { 'new_year': '1994-02-10', 'code': '00|1110101001010' },
    1995: { 'new_year': '1995-01-31', 'code': '08|0110101100101' },
    1996: { 'new_year': '1996-02-19', 'code': '00|0101101011000' },
    1997: { 'new_year': '1997-02-07', 'code': '00|1010101101100' },
    1998: { 'new_year': '1998-01-28', 'code': '05|1001001101101' },
    1999: { 'new_year': '1999-02-16', 'code': '00|1001001011100' },
    2000: { 'new_year': '2000-02-05', 'code': '00|1100100101100' },
    2001: { 'new_year': '2001-01-24', 'code': '04|1101010010101' },
    2002: { 'new_year': '2002-02-12', 'code': '00|1101010010100' },
    2003: { 'new_year': '2003-02-01', 'code': '00|1101101001010' },
    2004: { 'new_year': '2004-01-22', 'code': '02|0101101010101' },
    2005: { 'new_year': '2005-02-09', 'code': '00|0101011010100' },
    2006: { 'new_year': '2006-01-29', 'code': '07|1010101011011' },
    2007: { 'new_year': '2007-02-18', 'code': '00|0010010111010' },
    2008: { 'new_year': '2008-02-07', 'code': '00|1001001011010' },
    2009: { 'new_year': '2009-01-26', 'code': '05|1100100101011' },
    2010: { 'new_year': '2010-02-14', 'code': '00|1010100101010' },
    2011: { 'new_year': '2011-02-03', 'code': '00|1011010010100' },
    2012: { 'new_year': '2012-01-23', 'code': '04|1011010101010' },
    2013: { 'new_year': '2013-02-10', 'code': '00|1010110101010' },
    2014: { 'new_year': '2014-01-31', 'code': '09|0101010110101' },
    2015: { 'new_year': '2015-02-19', 'code': '00|0100101110100' },
    2016: { 'new_year': '2016-02-08', 'code': '00|1010010110110' },
    2017: { 'new_year': '2017-01-28', 'code': '06|0101001010111' },
    2018: { 'new_year': '2018-02-16', 'code': '00|0101001010110' },
    2019: { 'new_year': '2019-02-05', 'code': '00|1010100100110' },
    2020: { 'new_year': '2020-01-25', 'code': '04|0111010010101' },
    2021: { 'new_year': '2021-02-12', 'code': '00|0110101010100' },
    2022: { 'new_year': '2022-02-01', 'code': '00|1010110101010' },
    2023: { 'new_year': '2023-01-22', 'code': '02|0100110110101' },
    2024: { 'new_year': '2024-02-10', 'code': '00|0100101101100' },
    2025: { 'new_year': '2025-01-29', 'code': '06|1010010101110' },
    2026: { 'new_year': '2026-02-17', 'code': '00|1010010011100' },
    2027: { 'new_year': '2027-02-06', 'code': '00|1101001001100' },
    2028: { 'new_year': '2028-01-26', 'code': '05|1110100100110' },
    2029: { 'new_year': '2029-02-13', 'code': '00|1101010100110' },
    2030: { 'new_year': '2030-02-03', 'code': '00|0101101010100' },
    2031: { 'new_year': '2031-01-23', 'code': '03|0110110101000' }, # 閏3月
    2032: { 'new_year': '2032-02-11', 'code': '00|0010101101010' },
    2033: { 'new_year': '2033-01-31', 'code': '11|0100101011010' }, # 閏11月 (2033問題)
    2034: { 'new_year': '2034-02-19', 'code': '00|1010010101110' },
    2035: { 'new_year': '2035-02-08', 'code': '00|0101001001100' },
    2036: { 'new_year': '2036-01-28', 'code': '06|0111001001010' }, # 閏6月
    2037: { 'new_year': '2037-02-15', 'code': '00|1110101001010' },
    2038: { 'new_year': '2038-02-04', 'code': '00|0110110100100' },
    2039: { 'new_year': '2039-01-24', 'code': '05|0101101010100' }, # 閏5月
    2040: { 'new_year': '2040-02-12', 'code': '00|1001011011010' },
    2041: { 'new_year': '2041-02-01', 'code': '00|0100101011100' },
    2042: { 'new_year': '2042-01-22', 'code': '06|0100101011100' }, # 閏6月
    2043: { 'new_year': '2043-02-10', 'code': '00|1010010011010' },
    2044: { 'new_year': '2044-01-30', 'code': '07|0101001001101' }, # 閏7月
    2045: { 'new_year': '2045-02-17', 'code': '00|1101001001100' },
    2046: { 'new_year': '2046-02-06', 'code': '00|1101101001010' },
    2047: { 'new_year': '2047-01-26', 'code': '05|0101101010100' }, # 閏5月
    2048: { 'new_year': '2048-02-14', 'code': '00|1001011010100' },
    2049: { 'new_year': '2049-02-02', 'code': '00|0100101011010' },
    2050: { 'new_year': '2050-01-23', 'code': '03|0100100111010' }, # 閏3月
}



# ==========================================
# 2. 核心運算工具
# ==========================================

def sum_digits(n):
    """遞迴計算數字總和直到個位數"""
    s = str(n)
    while len(s) > 1:
        s = str(sum(int(d) for d in s))
    return int(s)

def calc_path(input_val, sign=""):
    """
    計算路徑 (支援三階層顯示，例如 29 -> 11 -> 2)
    回傳格式: "+29/11/2" 或 "-12/3" (保留符號，不補零)
    """
    s1 = sum(int(d) for d in str(input_val)) # 第一層總和
    
    path = f"{sign}{s1}"
    current = s1
    
    # 迴圈縮減，並記錄過程
    while current > 9:
        current = sum(int(d) for d in str(current))
        path += f"/{current}"
        
    return path, current

def get_innate_info(birthday_str):
    innate_digits = [int(d) for d in birthday_str]
    digit_counts = {}
    for d in innate_digits: 
        digit_counts[d] = digit_counts.get(d, 0) + 1
    has_triple = any(count >= 3 for count in digit_counts.values())
    return innate_digits, set(innate_digits), has_triple, digit_counts

def judge_level(total, main_number, innate_set, has_triple):
    if total >= 10: ant1, ant2 = total // 10, total % 10
    else: ant1, ant2 = 0, total 
    main_in = main_number in innate_set
    ant_hits = (1 if ant1 in innate_set else 0) + (1 if ant2 in innate_set else 0)
    if not main_in:
        return {0:1, 1:2, 2:3}.get(ant_hits, 1)
    else:
        if ant_hits == 0: return 4
        elif ant_hits == 1: return 5
        else: return 6 if has_triple else 7

def calc_score(level_int, innate_digits, main_number_int, target_numbers):
    base_score = 70 - (7 - level_int) * 5
    if base_score < 0: base_score = 0
    score = base_score
    for target in target_numbers:
        if target <= 9: score += innate_digits.count(target) * 5
    if main_number_int in target_numbers: score += 15
    return min(score, 100)

def check_flow_buff(flow_path_str, target_numbers):
    try:
        final_flow_num = int(flow_path_str.split('/')[-1])
        return final_flow_num in target_numbers
    except: return False

def calc_matrix_lines(innate_set):
    lines_def = {
        # 3 碼主連線
        '1-2-3': {'nums': {1, 2, 3}, 'name': '藝術線', 'desc': ''},
        '4-5-6': {'nums': {4, 5, 6}, 'name': '組織線', 'desc': ''},
        '7-8-9': {'nums': {7, 8, 9}, 'name': '權力線', 'desc': ''},
        '1-4-7': {'nums': {1, 4, 7}, 'name': '物質線', 'desc': ''},
        '2-5-8': {'nums': {2, 5, 8}, 'name': '感情線', 'desc': ''},
        '3-6-9': {'nums': {3, 6, 9}, 'name': '智慧線', 'desc': ''},
        '1-5-9': {'nums': {1, 5, 9}, 'name': '事業線', 'desc': ''},
        '3-5-7': {'nums': {3, 5, 7}, 'name': '人緣線', 'desc': ''},
        # 2 碼副連線 (能量跳脫)
        '2-4': {'nums': {2, 4}, 'name': '靈巧線', 'desc': ''},
        '2-6': {'nums': {2, 6}, 'name': '公平線', 'desc': ''},
        '6-8': {'nums': {6, 8}, 'name': '誠實線', 'desc': ''},
        '4-8': {'nums': {4, 8}, 'name': '模範線', 'desc': ''}
    }
    active_lines = []
    for key, rule in lines_def.items():
        if rule['nums'].issubset(innate_set):
            active_lines.append({'id': key, 'name': rule['name'], 'desc': rule['desc']})
    return active_lines

def get_lunar_struct(s_date):
    y = s_date.year
    if y not in LUNAR_DB: return None
    info = LUNAR_DB[y]
    ny = datetime.datetime.strptime(info['new_year'], "%Y-%m-%d").date()
    offset = (s_date - ny).days
    if offset < 0:
        y -= 1
        if y not in LUNAR_DB: return None
        info = LUNAR_DB[y]
        ny = datetime.datetime.strptime(info['new_year'], "%Y-%m-%d").date()
        offset = (s_date - ny).days
    leap, codes = info['code'].split('|')
    leap = int(leap)
    lm = 1
    is_leap = False
    for char in codes:
        days = 30 if char == '1' else 29
        if offset < days: return { "y": y, "m": lm, "d": offset + 1 }
        offset -= days
        if leap > 0 and lm == leap and not is_leap: is_leap = True
        else: lm += 1
    return None

def calc_flows_detailed(birth_y, birth_m, birth_d, curr_y, curr_m, curr_d, sign=""):
    if (curr_m, curr_d) >= (birth_m, birth_d):
        fy_base = curr_y
    else:
        fy_base = curr_y - 1

    fy_str = f"{fy_base}{birth_m:02d}{birth_d:02d}"
    fy_path, fy_num = calc_path(fy_str, sign)

    fm_str = f"{fy_base}{curr_m:02d}{birth_d:02d}"
    fm_path, fm_num = calc_path(fm_str, sign)

    fd_str = f"{birth_y}{birth_m:02d}{curr_d:02d}"
    fd_path, fd_num = calc_path(fd_str, sign)

    return {
        "year": {"path": fy_path, "num": fy_num},
        "month": {"path": fm_path, "num": fm_num},
        "day": {"path": fd_path, "num": fd_num}
    }

def get_color(score):
    if score >= 80: return {'fill': '#22d3ee', 'stroke': '#cffafe', 'intensity': 'high'}
    if score >= 60: return {'fill': '#06b6d4', 'stroke': '#67e8f9', 'intensity': 'mid'}
    return {'fill': '#0e7490', 'stroke': '#164e63', 'intensity': 'low'}

def calc_soul_level_full(birthday_str, sign=""):
    innate_digits, innate_set, has_triple, digit_counts = get_innate_info(birthday_str)
    total = sum(innate_digits)
    path_str, main_number = calc_path(birthday_str, sign)
    level = judge_level(total, main_number, innate_set, has_triple)
    return path_str, str(level), main_number, innate_digits, level, digit_counts

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    birth_year = int(data.get('year'))
    birth_month = int(data.get('month'))
    birth_day = int(data.get('day'))
    target_year = int(data.get('targetYear', datetime.date.today().year))
    
    today = datetime.date.today()
    curr_y = target_year
    curr_m = today.month
    curr_d = today.day
    
    bd_str = f"{birth_year}{birth_month:02d}{birth_day:02d}"
    
    solar_path, _, solar_main, solar_digits, solar_lv, solar_counts = calc_soul_level_full(bd_str, "+")
    solar_lv_str = str(judge_level(sum(solar_digits), solar_main, set(solar_digits), False))
    solar_flows = calc_flows_detailed(birth_year, birth_month, birth_day, curr_y, curr_m, curr_d, "+")
    solar_lines = calc_matrix_lines(set(solar_digits))
    
    solar_rules = {
        '職業成就': [1, 4, 8, 9], '物質財富': [4, 8], '身體健康': [1, 4, 5],
        '心靈成長': [7, 9, 11, 22, 33, 44], '社交人際': [2, 3, 5, 6],
        '家庭關係': [2, 6, 9], '休閒娛樂': [3, 5, 7]
    }
    solar_wheel = []
    for name, targets in solar_rules.items():
        score = calc_score(solar_lv, solar_digits, solar_main, targets)
        has_buff = check_flow_buff(solar_flows['year']['path'], targets)
        solar_wheel.append({ "name": name, "score": score, "angleValue": 1, "hasFlowBuff": has_buff, **get_color(score) })

    s_birth = datetime.date(birth_year, birth_month, birth_day)
    l_birth_struct = get_lunar_struct(s_birth)
    s_curr = datetime.date(curr_y, curr_m, curr_d)
    l_curr_struct = get_lunar_struct(s_curr)

    lunar_path, lunar_lv_str, lunar_main = "N/A", "-", 0
    lunar_flows = {"year": {"path": "-", "num": 0}, "month": {"path": "-", "num": 0}, "day": {"path": "-", "num": 0}}
    lunar_radar, lunar_lines, lunar_counts = [], [], {}
    lunar_date_str, lunar_today_str = "未校正", "未校正"

    if l_birth_struct:
        ly, lm, ld = l_birth_struct['y'], l_birth_struct['m'], l_birth_struct['d']
        lunar_date_str = f"陰曆 {ly}年 {lm}月 {ld}日"
        l_bd_str = f"{ly}{lm:02d}{ld:02d}"
        
        lunar_path, _, lunar_main, lunar_digits, lunar_lv, lunar_counts = calc_soul_level_full(l_bd_str, "-")
        lunar_lv_str = str(judge_level(sum(lunar_digits), lunar_main, set(lunar_digits), False))

        if l_curr_struct:
            l_curr_y, l_curr_m, l_curr_d = l_curr_struct['y'], l_curr_struct['m'], l_curr_struct['d']
            lunar_today_str = f"陰曆 {l_curr_y}/{l_curr_m}/{l_curr_d}"
            lunar_flows = calc_flows_detailed(ly, lm, ld, l_curr_y, l_curr_m, l_curr_d, "-")
        
        lunar_lines = calc_matrix_lines(set(lunar_digits))
        
        lunar_rules = [
            { "subject": '情感連結', "targets": [2, 4, 6] }, { "subject": '頻率共振', "targets": [2, 3, 5, 7, 9] },
            { "subject": '生存顯化', "targets": [1, 4, 8] }, { "subject": '情緒容納', "targets": [3, 7, 9] },
            { "subject": '核心信念', "targets": [7, 8, 9, 11, 22, 33] }
        ]
        for rule in lunar_rules:
            score = calc_score(lunar_lv, lunar_digits, lunar_main, rule['targets'])
            has_buff = check_flow_buff(lunar_flows['year']['path'], rule['targets'])
            lunar_radar.append({ "subject": rule['subject'], "A": score, "fullMark": 100, "hasFlowBuff": has_buff })
    else:
        lunar_radar = [{ "subject": '數據缺失', "A": 0, "fullMark": 100 }] * 5

    response_data = {
        "year": curr_y,
        "solarDateStr": f"陽曆 {birth_year}年 {birth_month}月 {birth_day}日", "lunarDateStr": lunar_date_str,
        "todayDateStr": f"{today.year}/{today.month}/{today.day}", "lunarTodayStr": lunar_today_str,
        "solar": solar_flows['year']['path'], "solarKw": "流年", "flowSolarLv": str(solar_flows['year']['num']),
        "solarMonth": solar_flows['month']['path'], "solarMonthNum": solar_flows['month']['num'],
        "solarDay": solar_flows['day']['path'], "solarDayNum": solar_flows['day']['num'],
        "mainSolar": solar_path, "mainSolarLv": solar_lv_str, "mainSolarNum": solar_main,
        "lunar": lunar_flows['year']['path'], "lunarKw": "流年", "flowLunarLv": str(lunar_flows['year']['num']),
        "lunarMonth": lunar_flows['month']['path'], "lunarMonthNum": lunar_flows['month']['num'],
        "lunarDay": lunar_flows['day']['path'], "lunarDayNum": lunar_flows['day']['num'],
        "mainLunar": lunar_path, "mainLunarLv": lunar_lv_str, "mainLunarNum": lunar_main,
        "solarWheel": solar_wheel, "lunarRadar": lunar_radar,
        "matrixData": { "solar": { "counts": solar_counts, "lines": solar_lines }, "lunar": { "counts": lunar_counts, "lines": lunar_lines } }
    }
    return jsonify(response_data)

@app.route('/calculate_lifecycle', methods=['POST'])
def calculate_lifecycle():
    data = request.json
    birth_year = int(data.get('year'))
    birth_month = int(data.get('month'))
    birth_day = int(data.get('day'))
    
    bd_str = f"{birth_year}{birth_month:02d}{birth_day:02d}"
    s_date = datetime.date(birth_year, birth_month, birth_day)
    l_struct = get_lunar_struct(s_date)
    ly, lm, ld = (l_struct['y'], l_struct['m'], l_struct['d']) if l_struct else (0, 0, 0)

    lifecycle_data = []
    for age in range(100):
        target_year = birth_year + age
        s_flows = calc_flows_detailed(birth_year, birth_month, birth_day, target_year, 12, 31, "+")
        l_flow_path, l_flow_num = "N/A", 0
        if l_struct:
            l_flows = calc_flows_detailed(ly, lm, ld, target_year, 12, 31, "-")
            l_flow_path = l_flows['year']['path']
            l_flow_num = l_flows['year']['num']
        
        cycle_keywords = { 1: "播種", 2: "連結", 3: "表達", 4: "建立", 5: "變動", 6: "奉獻", 7: "真理", 8: "豐盛", 9: "總結" }
        insight = cycle_keywords.get(s_flows['year']['num'], "未知")
        lifecycle_data.append({
            "age": age, "year": target_year, "insight": insight,
            "solarFlow": s_flows['year']['path'], "lunarFlow": l_flow_path,
            "solarNum": s_flows['year']['num'], "lunarNum": l_flow_num,
        })
    return jsonify(lifecycle_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)