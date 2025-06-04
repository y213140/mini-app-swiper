import React, { useRef, useEffect, useCallback } from "react";
import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import IndexStyle from "./index.module.less"
import Carousel from "../../components/carousel/index";
export const Component = () => {
    const [slideData, setSlideData] = useState([{ id: 0, content: "1" }, { id: 1, content: "第一个" }, { id: 2, content: "第二个" }, { id: 3, content: "第4个好长好长的好长的" }])
    return <View><Carousel
        className={[IndexStyle.contentView].join(" ")}
        width={"80vw"} data={slideData}>
        {
            slideData.map((item, index) => {
                return <View className={[IndexStyle.aa].join(" ")}>{item.content}</View>
            })
        }
    </Carousel></View>

}