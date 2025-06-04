import { useRef, useState, useEffect, memo, useCallback } from "react";
import Taro, { useDidShow, useReady, useLoad } from '@tarojs/taro';
import { View } from '@tarojs/components';
import IndexStyle from './index.module.less';
import { useMemo } from "react";

const MAX_RETRY = 5; // 最大重试次数
const RETRY_INTERVAL = 30; // 重试间隔(ms)
const THISCOMNAME = "Hourse-", THISCOMNAMEVIEW = 'HourseSwiper-'

const SlideItem = memo(({ dom, id, slide, index, onGetDom }) => {
    const timerRef = useRef(null);
    useEffect(() => {
        let retryCount = 0;
        const getDom = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            Taro.nextTick(() => {
                const query = Taro.createSelectorQuery();
                query.select(`#${THISCOMNAME}${id}-${index}`).boundingClientRect(res => {
                    if (res && res.height > 0 && res.width > 0) {
                        onGetDom(res);
                        return;
                    }
                    if (retryCount < MAX_RETRY) {
                        retryCount++;
                        console.log(`DOM获取失败，第${retryCount}次重试...`);
                        timerRef.current = setTimeout(getDom, RETRY_INTERVAL);
                    } else {
                        console.error(`无法获取 #${id}${index} 的DOM元素`);
                    }
                }).exec();
            });
        };
        getDom();
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return (
        <View id={`${THISCOMNAME}${id}-${index}`} className={IndexStyle.slideItem}>
            {dom}
        </View>
    )
});



const Carousel = ({ className, width, data, children }) => {
    const uuid = useCallback(() => {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";
        var uuid = s.join("");
        return uuid;
    }, [])
    const thisComponentUUid = useRef(uuid())
    const [propsOriginalSlides, setPropsOriginalSlides] = useState(data);
    const [extendedSlides, setextendedSlides] = useState([...propsOriginalSlides, ...propsOriginalSlides]);
    const [extendedSlidesDOM, setextendedSlidesDOM] = useState([...children, ...children]);

    // 使用 ref 存储状态
    const stateRef = useRef({
        slideWidths: [],
        totalWidth: 0,
        realContentWidth: 0,
        lastTimestamp: 0,
        duration: 15000, // 15秒完成一轮
        animationFrameId: null
    });

    const [translateX, setTranslateX] = useState(0);
    const [isMeasuring, setIsMeasuring] = useState(true);

    const ins = useMemo(() => { return Taro.getCurrentInstance()?.page }, []);

    const childDom = useRef([]);
    const [childDomProxy, setChildDomProxy] = useState([])



    // 动态测量Slide宽度
    useEffect(() => {
        if (childDom.current.length === extendedSlides.length) {
            (async () => {
                const measureSlides = (contentWidth) => {
                    try {
                        const measurements = childDom.current.map(item => item?.width)
                        stateRef.current.slideWidths = measurements;
                        stateRef.current.totalWidth = measurements.reduce((sum, width) => sum + width, 0);
                        stateRef.current.realContentWidth = measurements
                            .slice(0, measurements.length / 2)
                            .reduce((sum, width) => sum + width, 0);
                        if (stateRef.current.realContentWidth > contentWidth) {
                            setIsMeasuring(false);
                        } else {
                            /**
                             * 
                             * 去除多余的数据
                             * 
                             */
                            setextendedSlides(propsOriginalSlides)
                        }
                    } catch (error) {
                        console.error('Error measuring slides:', error);
                    }
                };
                const getContentDomView = () => {
                    return new Promise((resolve, rej) => {
                        // 获取容器宽度
                        const query = Taro.createSelectorQuery();
                        query.select(`#${THISCOMNAMEVIEW}${thisComponentUUid.current}`).boundingClientRect(function (res) {
                            resolve(res)
                        }).exec();
                    });
                }
                const data = await getContentDomView();
                measureSlides(data?.width);
            })()
        }
    }, [childDomProxy]);

    // 自动滚动逻辑 - 使用requestAnimationFrame但只更新状态
    useEffect(() => {
        if (isMeasuring || stateRef.current.slideWidths.length === 0) return;
        // 防抖
        const animate = (timestamp) => {
            if (!stateRef.current.lastTimestamp) {
                stateRef.current.lastTimestamp = timestamp;
            }

            const elapsed = timestamp - stateRef.current.lastTimestamp;
            const progress = elapsed / stateRef.current.duration;

            // 计算当前位移
            let newTranslateX = -progress * stateRef.current.totalWidth;

            // 边界检测
            if (-newTranslateX >= stateRef.current.realContentWidth) {
                // 无缝跳转
                newTranslateX = -stateRef.current.realContentWidth;
                // 重置时间基准
                stateRef.current.lastTimestamp = timestamp;
            }

            // 更新状态
            setTranslateX(newTranslateX);

            // 继续动画循环
            stateRef.current.animationFrameId = requestAnimationFrame(animate);
        };

        // 启动动画
        stateRef.current.animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (stateRef.current.animationFrameId) {
                cancelAnimationFrame(stateRef.current.animationFrameId);
            }
        };
    }, [isMeasuring]);

    const onGetDom = (e) => {
        let copyArray = [...childDom.current];
        copyArray.push(e)
        childDom.current = copyArray;
        if (childDom.current.length === extendedSlides.length) {
            setChildDomProxy(childDom.current)
        }
    }

    return (
        <View id={THISCOMNAMEVIEW + thisComponentUUid.current} style={{ width }} className={[IndexStyle.carouselContainer, className].join(" ")}>
            <View
                className={IndexStyle.slidesWrapper}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: 'none',
                }}
            >
                {extendedSlides.map((slide, index) => (
                    <SlideItem onGetDom={onGetDom} dom={extendedSlidesDOM[index]} id={thisComponentUUid.current} key={`${thisComponentUUid.current}-${index}`} index={index} />
                ))}
            </View>
        </View>
    );
};


export default Carousel
