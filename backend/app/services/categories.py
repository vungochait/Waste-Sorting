"""6 nhóm rác và hướng dẫn xử lý theo từng loại vật thể."""
from __future__ import annotations

from typing import Any

CATEGORIES: list[dict[str, Any]] = [
    {
        "id": "organic",
        "name": "Rác hữu cơ",
        "name_en": "Organic Waste",
        "color": "#22C55E",
        "ink": "#15803D",
        "icon": "leaf",
        "bin": "Thùng rác hữu cơ (xanh lá)",
        "examples": ["Thức ăn thừa", "Rau củ quả", "Lá cây", "Vỏ trái cây"],
        "instructions": [
            "Tách khỏi túi nilon, hộp và giấy gói.",
            "Để ráo nước trước khi bỏ.",
            "Bỏ vào thùng rác hữu cơ.",
            "Có thể ủ phân compost tại nhà.",
        ],
        "recommendation": "Rác hữu cơ có thể ủ thành phân bón hoặc khí sinh học thay vì đem chôn lấp.",
    },
    {
        "id": "recyclable",
        "name": "Rác tái chế",
        "name_en": "Recyclable Waste",
        "color": "#0EA5E9",
        "ink": "#0369A1",
        "icon": "recycle",
        "bin": "Thùng rác tái chế (xanh dương)",
        "examples": ["Chai nhựa", "Giấy", "Bìa carton", "Lon nhôm", "Chai thủy tinh"],
        "instructions": [
            "Làm sạch và để khô.",
            "Tháo nắp, bóc nhãn nếu được.",
            "Ép hoặc gấp gọn để tiết kiệm chỗ.",
            "Bỏ vào thùng rác tái chế hoặc bán phế liệu.",
        ],
        "recommendation": "Vật liệu sạch, khô và không lẫn tạp chất thì dễ tái chế hơn nhiều.",
    },
    {
        "id": "nonrecyclable",
        "name": "Rác vô cơ",
        "name_en": "Non-recyclable Waste",
        "color": "#64748B",
        "ink": "#475569",
        "icon": "trash",
        "bin": "Thùng rác vô cơ / rác còn lại (xám)",
        "examples": ["Túi nilon bẩn", "Gốm sứ vỡ", "Rác hỗn hợp khó tái chế"],
        "instructions": [
            "Gói kín mảnh vỡ sắc nhọn trước khi bỏ.",
            "Không trộn lẫn với rác tái chế hoặc rác hữu cơ.",
            "Bỏ vào thùng rác vô cơ.",
        ],
        "recommendation": "Hạn chế túi nilon và đồ dùng một lần để giảm loại rác này.",
    },
    {
        "id": "hazardous",
        "name": "Rác nguy hại",
        "name_en": "Hazardous Waste",
        "color": "#EF4444",
        "ink": "#B91C1C",
        "icon": "alert",
        "bin": "Điểm thu gom rác nguy hại (đỏ)",
        "examples": ["Pin", "Ắc quy", "Bóng đèn huỳnh quang", "Hóa chất gia dụng"],
        "instructions": [
            "Không bỏ chung với rác sinh hoạt.",
            "Giữ nguyên bao bì, không đổ hóa chất xuống cống.",
            "Bọc kín, để nơi khô ráo, xa tầm tay trẻ em.",
            "Mang đến điểm thu gom rác nguy hại.",
        ],
        "recommendation": "Rác nguy hại chứa chất độc hoặc kim loại nặng. Xử lý sai có thể gây cháy nổ và ô nhiễm đất, nước.",
    },
    {
        "id": "ewaste",
        "name": "Rác điện tử",
        "name_en": "E-waste",
        "color": "#A855F7",
        "ink": "#7E22CE",
        "icon": "cpu",
        "bin": "Điểm thu hồi rác điện tử (tím)",
        "examples": ["Điện thoại cũ", "Linh kiện điện tử", "Dây điện", "Thiết bị điện tử hỏng"],
        "instructions": [
            "Sao lưu và xóa dữ liệu cá nhân.",
            "Tháo pin nếu được và thu gom riêng.",
            "Không tự tháo dỡ hay đập phá.",
            "Mang đến điểm thu hồi hoặc chương trình thu cũ đổi mới.",
        ],
        "recommendation": "Thiết bị điện tử chứa kim loại quý, có thể thu hồi qua đơn vị tái chế chuyên dụng.",
    },
    {
        "id": "other",
        "name": "Rác khác",
        "name_en": "Other",
        "color": "#F59E0B",
        "ink": "#B45309",
        "icon": "help",
        "bin": "Cần kiểm tra thủ công",
        "examples": ["Vật thể chưa xác định được nhóm"],
        "instructions": [
            "Kiểm tra lại vật thể bằng mắt.",
            "Đối chiếu hướng dẫn trong mục Kiến thức môi trường.",
            "Nếu không chắc chắn, bỏ vào thùng rác vô cơ.",
        ],
        "recommendation": "Thêm lớp này vào ai/yolo/class_map.yaml hoặc vào dữ liệu huấn luyện để AI xếp nhóm chính xác hơn.",
    },
]

CATEGORY_BY_ID: dict[str, dict[str, Any]] = {c["id"]: c for c in CATEGORIES}
CATEGORY_IDS = [c["id"] for c in CATEGORIES]

# Hướng dẫn chi tiết theo loại vật thể. "instructions"/"recommendation" bỏ trống sẽ dùng của nhóm.
LABEL_GUIDES: dict[str, dict[str, Any]] = {
    "plastic_bottle": {
        "name": "Chai nhựa", "category": "recyclable",
        "instructions": ["Đổ hết chất lỏng bên trong.", "Làm sạch chai.", "Ép gọn chai nếu phù hợp.",
                         "Bỏ vào thùng rác tái chế."],
        "recommendation": "Tháo nắp và gom riêng nếu điểm thu gom yêu cầu. Chai PET tái chế được thành sợi và bao bì mới.",
    },
    "glass_bottle": {
        "name": "Chai thủy tinh", "category": "recyclable",
        "instructions": ["Đổ hết chất lỏng, tráng sạch.", "Tháo nắp kim loại hoặc nhựa.", "Không đập vỡ chai.",
                         "Bỏ vào thùng tái chế thủy tinh."],
        "recommendation": "Thủy tinh tái chế được nhiều lần; chai còn nguyên có thể tái sử dụng.",
    },
    "glass": {"name": "Thủy tinh", "category": "recyclable"},
    "can": {
        "name": "Lon kim loại", "category": "recyclable",
        "instructions": ["Đổ hết đồ uống còn lại.", "Tráng sơ bằng nước.", "Ép dẹt lon.", "Bỏ vào thùng rác tái chế."],
        "recommendation": "Nhôm tái chế được nhiều lần mà không giảm chất lượng.",
    },
    "metal": {"name": "Kim loại", "category": "recyclable"},
    "paper": {
        "name": "Giấy", "category": "recyclable",
        "instructions": ["Giữ giấy khô, không dính dầu mỡ.", "Gỡ ghim kẹp, băng keo.", "Xếp phẳng hoặc buộc gọn.",
                         "Bỏ vào thùng tái chế."],
        "recommendation": "Giấy dính thức ăn hoặc dầu mỡ không tái chế được – bỏ vào rác hữu cơ hoặc vô cơ.",
    },
    "cardboard": {
        "name": "Bìa carton", "category": "recyclable",
        "instructions": ["Gỡ băng keo và xốp chèn.", "Gấp phẳng thùng.", "Giữ khô ráo.",
                         "Bỏ vào thùng tái chế hoặc bán phế liệu."],
        "recommendation": "Carton ướt hoặc dính dầu mỡ giảm giá trị tái chế.",
    },
    "plastic": {"name": "Đồ nhựa", "category": "recyclable"},
    "plastic_container": {"name": "Hộp nhựa", "category": "recyclable"},
    "bottle_cap": {"name": "Nắp chai", "category": "recyclable"},
    "plastic_bag": {
        "name": "Túi nilon", "category": "nonrecyclable",
        "instructions": ["Túi còn sạch: tái sử dụng làm túi đựng rác.", "Túi bẩn: buộc gọn lại.",
                         "Bỏ vào thùng rác vô cơ."],
        "recommendation": "Mang túi vải khi đi chợ để giảm lượng túi nilon.",
    },
    "styrofoam": {"name": "Hộp xốp", "category": "nonrecyclable"},
    "ceramic": {
        "name": "Gốm sứ vỡ", "category": "nonrecyclable",
        "instructions": ["Gói kín mảnh vỡ bằng giấy báo hoặc hộp.", "Ghi chú “vật sắc nhọn” bên ngoài.",
                         "Bỏ vào thùng rác vô cơ."],
        "recommendation": "Gốm sứ không tái chế cùng thủy tinh; đồ còn dùng được nên cho tặng.",
    },
    "cigarette": {"name": "Đầu lọc thuốc lá", "category": "nonrecyclable"},
    "trash": {"name": "Rác hỗn hợp", "category": "nonrecyclable"},
    "food_waste": {
        "name": "Thức ăn thừa", "category": "organic",
        "instructions": ["Chắt bớt nước canh.", "Tách khỏi hộp, túi đựng.", "Bỏ vào thùng rác hữu cơ."],
        "recommendation": "Có thể ủ compost hoặc làm thức ăn chăn nuôi (nếu phù hợp).",
    },
    "fruit_peel": {
        "name": "Vỏ trái cây", "category": "organic",
        "instructions": ["Tách khỏi túi, hộp đựng.", "Bỏ vào thùng rác hữu cơ.", "Có thể ủ phân compost tại nhà."],
        "recommendation": "Vỏ trái cây phân hủy nhanh, rất phù hợp để ủ phân bón cho cây.",
    },
    "vegetable": {"name": "Rau củ quả", "category": "organic"},
    "leaves": {"name": "Lá cây", "category": "organic"},
    "battery": {
        "name": "Pin", "category": "hazardous",
        "instructions": ["Không bỏ chung với rác sinh hoạt.", "Dán băng keo hai cực nếu pin còn điện.",
                         "Cho vào hộp riêng, để nơi khô ráo.", "Mang đến điểm thu gom pin."],
        "recommendation": "Pin chứa kim loại nặng; vứt sai cách có thể gây cháy và rò rỉ ra đất, nước.",
    },
    "car_battery": {
        "name": "Ắc quy", "category": "hazardous",
        "instructions": ["Để thẳng đứng, không làm đổ dung dịch axit.", "Không tự tháo vỏ.",
                         "Mang đến cửa hàng ắc quy hoặc điểm thu gom rác nguy hại."],
    },
    "light_bulb": {
        "name": "Bóng đèn huỳnh quang", "category": "hazardous",
        "instructions": ["Không làm vỡ bóng (có thể chứa hơi thủy ngân).", "Bọc trong hộp hoặc giấy báo.",
                         "Mang đến điểm thu gom rác nguy hại."],
    },
    "chemical": {
        "name": "Hóa chất gia dụng", "category": "hazardous",
        "instructions": ["Giữ nguyên trong bình chứa gốc, đậy kín.", "Không đổ xuống cống hay trộn lẫn.",
                         "Mang đến điểm thu gom rác nguy hại."],
    },
    "phone": {
        "name": "Điện thoại cũ", "category": "ewaste",
        "instructions": ["Sao lưu và xóa dữ liệu.", "Tháo SIM, thẻ nhớ.",
                         "Mang đến điểm thu hồi hoặc chương trình thu cũ đổi mới."],
    },
    "electronic_device": {"name": "Thiết bị điện tử", "category": "ewaste"},
    "electronic_component": {"name": "Linh kiện điện tử", "category": "ewaste"},
    "cable": {
        "name": "Dây điện", "category": "ewaste",
        "instructions": ["Cuộn gọn và buộc lại.", "Không đốt để lấy lõi đồng.", "Mang đến điểm thu hồi rác điện tử."],
    },
}


def build_guide(guide_key: str | None, category: str, fallback_name: str) -> dict[str, Any]:
    cat = CATEGORY_BY_ID.get(category, CATEGORY_BY_ID["other"])
    g = LABEL_GUIDES.get(guide_key or "", {})
    return {
        "name": g.get("name", fallback_name),
        "category": cat["id"],
        "instructions": list(g.get("instructions") or cat["instructions"]),
        "recommendation": g.get("recommendation") or cat["recommendation"],
        "bin": cat["bin"],
    }
