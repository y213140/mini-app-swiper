import React, { useRef, useEffect, useCallback } from "react";
import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import IndexStyle from "./index.module.less"
import Carousel from "../../components/carousel/index";
const Component = () => {
    const [slideData, setSlideData] = useState([{ id: 0, content: "1" }, { id: 1, content: "第一个" }, { id: 2, content: "第二个" }, { id: 3, content: "第4个好长好长的好长的" }])
    const slideEvent = (e, i) => {
        console.log(e, i)
    }
    return <Carousel
        className={[IndexStyle.contentView].join(" ")}
        width={"80vw"} data={slideData}
        speed={3000}
    >
        {
            slideData.map((item, index) => {
                return <View key={'slideDataItem_' + index} onClick={() => slideEvent(item, index)} className={[IndexStyle.slideView].join(" ")}>{item.content}</View>
            })
        }
    </Carousel>

}
export default Component