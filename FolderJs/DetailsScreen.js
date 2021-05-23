import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  ScrollView,
  Text,
  TouchableNativeFeedback,
  FlatList,
} from 'react-native';
import {COLORS, SIZES, ThemeStyle} from '../constants';
import LinearGradient from 'react-native-linear-gradient';
import CardLocationIcon from '../assets/icons/CardLocationIcon';
import CardHouseIcon from '../assets/icons/CardHouseIcon';
import CardSchoolIcon from '../assets/icons/CardSchoolIcon';
import {BriefcaseIcon} from '../assets/icons';
import {useDispatch, useSelector, useStore} from 'react-redux';
import {
  fetchAvailableReportSubjects,
  toggleReportModal,
} from '../store/actions/report';
import Lottie from 'lottie-react-native';

const INTEREST_COLORS = [
  '129,162,255',
  '255,170,83',
  '255,134,116',
  '134,216,216',
  '176,95,255',
];
const randomColor = () => {
  return INTEREST_COLORS[Math.floor(Math.random() * INTEREST_COLORS.length)];
};

function Photos({photos, index}) {
  const [currentIndex, setCurrentIndex] = useState(index);

  return (
    <View>
      <Image
        style={styles.photos}
        source={{
          uri: photos[currentIndex],
        }}
        resizeMode="cover"
      />
      <View style={styles.touchableContainer}>
        <TouchableOpacity
          style={ThemeStyle.flex1}
          onPress={() => {
            setCurrentIndex((prevState) =>
              prevState > 0 ? prevState - 1 : prevState,
            );
          }}
        />
        <TouchableOpacity
          style={ThemeStyle.flex1}
          onPress={() => {
            setCurrentIndex((prevState) =>
              prevState < photos.length - 1 ? prevState + 1 : prevState,
            );
          }}
        />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'transparent']}
        style={styles.pagination}>
        {photos.map((_, i) => (
          <View key={i} style={styles.index(i === currentIndex)} />
        ))}
      </LinearGradient>
    </View>
  );
}

export default function DetailsScreen(props) {
  const dispatch = useDispatch();
  const {card} = props.route.params;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Photos photos={card.photoUrls} index={card.currentPhotoIndex} />
        <View style={styles.infoContainer}>
          <Text>
            <Text style={styles.name}>{card.name}</Text>
            <Text style={styles.age}> {card.age}</Text>
          </Text>
          {card.jobTitle && (
            <View style={styles.row}>
              <BriefcaseIcon fillColor={COLORS.neutral2} />
              <Text style={styles.infoText}>
                {card.jobTitle} {card.company && `at ${card.company}`}
              </Text>
            </View>
          )}
          {card.city && (
            <View style={styles.row}>
              <CardHouseIcon fillColor={COLORS.neutral2} />
              <Text style={styles.infoText}>Lives in {card.city}</Text>
            </View>
          )}
          <View style={styles.row}>
            <CardLocationIcon fillColor={COLORS.neutral2} />
            <Text style={styles.infoText}>{card.distance} km away</Text>
          </View>
          {card.school && (
            <View style={styles.row}>
              <CardSchoolIcon fillColor={COLORS.neutral2} />
              <Text style={styles.infoText}>Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh</Text>
            </View>
          )}

          <Text style={styles.title}>About</Text>
          <Text style={styles.bio}>{card.bio}</Text>
          <Text style={styles.title}>Interests</Text>
          {card.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {card.interests.map((item, i) => (
                <Text key={i} style={styles.interest(item.isCommon)}>
                  {item.name}
                </Text>
              ))}
            </View>
          )}
        </View>
        <TouchableNativeFeedback
          onPress={() => {
            dispatch(toggleReportModal('report', card.id, card.name));
          }}>
          <View style={styles.reportButton}>
            <Text style={styles.reportText}>REPORT {card.name}</Text>
          </View>
        </TouchableNativeFeedback>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral5,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  infoContainer: {
    padding: 28,
    paddingTop: 20,
  },
  name: {
    fontFamily: 'CerebriSans-Semibold',
    fontSize: 32,
    color: COLORS.neutral1,
  },
  age: {
    fontFamily: 'CerebriSans-Book',
    fontSize: 24,
    color: COLORS.neutral3,
  },
  title: {
    fontFamily: 'CerebriSans-Semibold',
    fontSize: 16,
    color: COLORS.neutral1,
    marginBottom: 8,
    marginTop: 20,
  },
  bio: {
    fontFamily: 'CerebriSans-Light',
    fontSize: 16,
    // lineHeight: 24.8,
    color: COLORS.neutral2,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -8,
  },
  photos: {
    width: SIZES.windowWidth,
    height: SIZES.windowWidth * (4 / 3),
  },
  pagination: {
    flexDirection: 'row',
    width: '100%',
    padding: 5,
    position: 'absolute',
    height: 34,
  },
  touchableContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  infoText: {
    fontFamily: 'CerebriSans-Light',
    fontSize: 16,
    color: COLORS.neutral2,
    flex: 1,
  },
  reportButton: {
    height: 64,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.neutral4,
  },
  reportText: {
    textAlign: 'center',
    fontFamily: 'CerebriSans-Semibold',
    textTransform: 'uppercase',
    color: COLORS.neutral3,
    fontSize: 16,
  },
  index: (active) => ({
    flex: 1,
    height: 3,
    borderRadius: 3,
    marginHorizontal: 2,
    backgroundColor: active ? COLORS.neutral5 : 'rgba(255,255,255,0.3)',
  }),
  interest: (isCommon) => {
    const color = randomColor();
    return {
      fontFamily: 'Avenir-Heavy',
      paddingHorizontal: 16,
      marginRight: 8,
      marginTop: 8,
      color: isCommon ? `rgb(${color})` : COLORS.neutral3,
      backgroundColor: isCommon ? `rgba(${color}, 0.16)` : COLORS.neutral4,
      borderRadius: 24,
      height: 24,
      textAlignVertical: 'center',
    };
  },
});
